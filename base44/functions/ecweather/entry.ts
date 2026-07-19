import { SignJWT } from 'npm:jose@5.9.6';

// Cache for site list (24h TTL)
let siteListCache = null;
let siteListCacheTime = 0;

const SITE_LIST_URL = 'https://dd.weather.gc.ca/today/citypage_weather/docs/site_list_towns_en.csv';
const WEATHER_BASE = 'https://dd.weather.gc.ca/today/citypage_weather';

// EC icon code → WMO weather code (used by frontend WeatherGlyph)
const ecIconToWMO = {
  0: 0, 1: 1, 2: 2, 3: 2, 4: 2, 5: 1,
  6: 80, 7: 85, 8: 71, 9: 95,
  10: 3, 11: 3, 12: 63, 13: 65, 14: 61,
  15: 85, 16: 71, 17: 73, 18: 75, 19: 95,
  22: 2, 23: 45, 24: 45, 27: 75, 28: 53,
  29: 3, 30: 0, 31: 1, 32: 2, 33: 3,
  34: 2, 35: 1, 36: 80, 37: 85, 38: 71,
  39: 95, 40: 75, 43: 3, 44: 45, 46: 96,
  47: 95, 48: 95,
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getSiteList() {
  const now = Date.now();
  if (siteListCache && (now - siteListCacheTime) < 86400000) {
    return siteListCache;
  }
  const res = await fetch(SITE_LIST_URL);
  const csv = await res.text();
  const lines = csv.split('\n');
  const sites = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;
    const code = parts[0].trim();
    const name = parts[1].trim();
    const province = parts[2].trim();
    if (!code || !province || province === 'HEF') continue;
    const latStr = parts[3];
    const lonStr = parts[4];
    if (!latStr || !lonStr) continue;
    const lat = parseFloat(latStr.replace('N', ''));
    const lon = -1 * parseFloat(lonStr.replace('W', ''));
    if (isNaN(lat) || isNaN(lon)) continue;
    sites.push({ code, name, province, lat, lon });
  }
  siteListCache = sites;
  siteListCacheTime = now;
  return sites;
}

function findClosestSite(sites, lat, lon) {
  let closest = null;
  let minDist = Infinity;
  for (const site of sites) {
    const dist = haversine(lat, lon, site.lat, site.lon);
    if (dist < minDist) {
      minDist = dist;
      closest = site;
    }
  }
  return { site: closest, distance: minDist };
}

async function fetchWeatherXml(province, stationCode) {
  const now = new Date();
  for (let hoursBack = 0; hoursBack < 4; hoursBack++) {
    const checkTime = new Date(now.getTime() - hoursBack * 3600000);
    const hourStr = String(checkTime.getUTCHours()).padStart(2, '0');
    const dirUrl = `${WEATHER_BASE}/${province}/${hourStr}/`;
    try {
      const res = await fetch(dirUrl);
      if (!res.ok) continue;
      const html = await res.text();
      const regex = new RegExp(`href="([^"]*${stationCode}[^"]*_en\\.xml)"`, 'i');
      const match = html.match(regex);
      if (match) {
        const fileUrl = `${dirUrl}${match[1]}`;
        const xmlRes = await fetch(fileUrl);
        if (xmlRes.ok) {
          return await xmlRes.text();
        }
      }
    } catch (e) {
      // try next hour
    }
  }
  throw new Error('Could not fetch weather data from Environment Canada');
}

// --- Regex-based XML helpers ---

function getTagText(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's'));
  return match ? match[1].trim() : null;
}

function getAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*?\\s${attr}="([^"]*)"`, 's'));
  return match ? match[1] : null;
}

function parseECTimestamp(ts) {
  if (!ts) return null;
  let m = ts.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
  if (!m) {
    m = ts.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  }
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

function getForecastTemp(forecastXml, tempClass) {
  const tempsMatch = forecastXml.match(/<temperatures>([\s\S]*?)<\/temperatures>/);
  if (!tempsMatch) return null;
  const re = new RegExp(`<temperature[^>]*class="${tempClass}"[^>]*>(.*?)</temperature>`, 's');
  const match = tempsMatch[1].match(re);
  return match ? match[1].trim() : null;
}

function getForecastIconCode(forecastXml) {
  const abbrMatch = forecastXml.match(/<abbreviatedForecast>([\s\S]*?)<\/abbreviatedForecast>/);
  const context = abbrMatch ? abbrMatch[1] : forecastXml;
  return getTagText(context, 'iconCode');
}

function getForecastPop(forecastXml) {
  const abbrMatch = forecastXml.match(/<abbreviatedForecast>([\s\S]*?)<\/abbreviatedForecast>/);
  if (!abbrMatch) return null;
  return getTagText(abbrMatch[1], 'pop');
}

function getRiseSet(riseSetXml, name) {
  const re = new RegExp(`<dateTime[^>]*name="${name}"[^>]*>([\\s\\S]*?)</dateTime>`, 'g');
  const matches = [];
  let match;
  while ((match = re.exec(riseSetXml)) !== null) {
    const fullTag = match[0];
    const content = match[1];
    const offsetMatch = fullTag.match(/UTCOffset="([^"]*)"/);
    const offset = offsetMatch ? offsetMatch[1] : null;
    const ts = getTagText(content, 'timeStamp');
    matches.push({ offset, ts });
  }
  // Prefer UTC (offset 0)
  const utc = matches.find(m => m.offset === '0');
  if (utc && utc.ts) return parseECTimestamp(utc.ts);
  if (matches.length > 0 && matches[0].ts) return parseECTimestamp(matches[0].ts);
  return null;
}

function parseWeatherXml(xmlText, localDate, tzOffset) {
  const ccMatch = xmlText.match(/<currentConditions>([\s\S]*?)<\/currentConditions>/);
  const fgMatch = xmlText.match(/<forecastGroup>([\s\S]*?)<\/forecastGroup>/);
  const rsMatch = xmlText.match(/<riseSet>([\s\S]*?)<\/riseSet>/);

  const cc = ccMatch ? ccMatch[1] : '';
  const fg = fgMatch ? fgMatch[1] : '';
  const rs = rsMatch ? rsMatch[1] : '';

  // --- Current conditions ---
  const condition = getTagText(cc, 'condition');
  const temperature = parseFloat(getTagText(cc, 'temperature')) || 0;
  const dewpoint = parseFloat(getTagText(cc, 'dewpoint')) || 0;
  const windChill = getTagText(cc, 'windChill');
  const humidexVal = getTagText(cc, 'humidex');
  const humidexNum = humidexVal ? parseFloat(humidexVal) : null;
  const pressure = parseFloat(getTagText(cc, 'pressure')) || 0;
  const pressureTendency = getAttr(cc, 'pressure', 'tendency');
  const humidity = parseInt(getTagText(cc, 'relativeHumidity')) || 0;
  const visibility = parseFloat(getTagText(cc, 'visibility')) || 0;
  const windSpeed = parseFloat(getTagText(cc, 'speed')) || 0;
  const windDirection = getTagText(cc, 'direction');
  const iconCode = parseInt(getTagText(cc, 'iconCode')) || 0;
  const uvIndexVal = getAttr(cc, 'uv', 'index');
  const uvIndexNum = uvIndexVal ? parseFloat(uvIndexVal) : null;
  const uvCategory = getAttr(cc, 'uv', 'category');

  // Fallback: extract UV index from the first forecast's text summary
  // (EC XML includes UV in currentConditions only during certain hours,
  //  but the forecast text consistently mentions it, e.g. "UV index 8 or very high")
  let uvIndexFallback = uvIndexNum;
  let uvCategoryFallback = uvCategory;
  if (uvIndexFallback == null) {
    const firstForecast = fgMatch ? (fgMatch[1].match(/<forecast[^>]*>[\s\S]*?<\/forecast>/) || [])[0] : null;
    const summaryText = firstForecast ? getTagText(firstForecast, 'textSummary') : null;
    if (summaryText) {
      const uvMatch = summaryText.match(/UV index\s+(\d+)\s+or\s+([^.]+)/i);
      if (uvMatch) {
        uvIndexFallback = parseFloat(uvMatch[1]);
        uvCategoryFallback = uvMatch[2].trim();
      }
    }
  }

  let apparentTemp = temperature;
  if (windChill) apparentTemp = parseFloat(windChill);
  else if (humidexVal) apparentTemp = parseFloat(humidexVal);

  const current = {
    temperature_2m: temperature,
    dewpoint: dewpoint,
    relative_humidity_2m: humidity,
    apparent_temperature: apparentTemp,
    humidex: humidexNum,
    precipitation: 0,
    weather_code: ecIconToWMO[iconCode] ?? 3,
    condition: condition,
    wind_speed_10m: windSpeed,
    wind_direction: windDirection,
    visibility: visibility, // km
    pressure: pressure,
    pressure_tendency: pressureTendency,
    uv_index: uvIndexFallback,
    uv_category: uvCategoryFallback,
  };

  // --- Forecast periods ---
  const forecastRe = /<forecast[^>]*>[\s\S]*?<\/forecast>/g;
  const forecastMatches = fg.match(forecastRe) || [];
  const forecasts = forecastMatches.map(f => {
    const period = getAttr(f, 'period', 'textForecastName');
    const tempHigh = getForecastTemp(f, 'high');
    const tempLow = getForecastTemp(f, 'low');
    const ic = parseInt(getForecastIconCode(f)) || 0;
    const pop = parseInt(getForecastPop(f)) || 0;
    const textSummary = getTagText(f, 'textSummary');
    return { period, textSummary, tempHigh, tempLow, iconCode: ic, pop };
  });

  // --- Sunrise / sunset (today only) ---
  const sunrise = getRiseSet(rs, 'sunrise');
  const sunset = getRiseSet(rs, 'sunset');

  // --- Build daily forecast ---
  const daily = {
    time: [],
    weather_code: [],
    temperature_2m_max: [],
    temperature_2m_min: [],
    precipitation_sum: [],
    precipitation_probability: [],
    sunrise: [],
    sunset: [],
    text_summary: [],
    night_text_summary: [],
  };

  // Use the frontend-provided local date to avoid UTC timezone drift
  const today = localDate ? new Date(localDate + 'T00:00:00') : new Date();
  let dayOffset = 0;
  let i = 0;
  while (i < forecasts.length) {
    const f = forecasts[i];
    let highTemp = null, lowTemp = null, dayIcon = 0, dayPop = 0;
    let dayTextSummary = null, nightTextSummary = null;

    // If the first usable forecast is a night-only period ("Tonight"),
    // record it for today without pairing it forward — prevents date shifting.
    if (dayOffset === 0 && !f.tempHigh && f.tempLow) {
      lowTemp = parseFloat(f.tempLow);
      dayIcon = f.iconCode;
      dayPop = f.pop;
      nightTextSummary = f.textSummary;
      dayTextSummary = f.textSummary;
      highTemp = lowTemp; // use tonight's low as the high for today's partial entry

      const date = new Date(today);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      daily.time.push(dateStr);
      daily.weather_code.push(ecIconToWMO[dayIcon] ?? 3);
      daily.temperature_2m_max.push(highTemp);
      daily.temperature_2m_min.push(lowTemp);
      daily.precipitation_sum.push(0);
      daily.precipitation_probability.push(dayPop);
      daily.sunrise.push(sunrise);
      daily.sunset.push(sunset);
      daily.text_summary.push(dayTextSummary);
      daily.night_text_summary.push(nightTextSummary);
      dayOffset++;
      i += 1;
      continue;
    }

    if (f.tempHigh) {
      // Day period
      highTemp = parseFloat(f.tempHigh);
      dayIcon = f.iconCode;
      dayPop = f.pop;
      dayTextSummary = f.textSummary;
      if (i + 1 < forecasts.length && forecasts[i + 1].tempLow) {
        lowTemp = parseFloat(forecasts[i + 1].tempLow);
        nightTextSummary = forecasts[i + 1].textSummary;
        i += 2;
      } else {
        i += 1;
      }
    } else if (f.tempLow) {
      // Night period (likely "Tonight" - pair with following day)
      lowTemp = parseFloat(f.tempLow);
      dayIcon = f.iconCode;
      dayPop = f.pop;
      nightTextSummary = f.textSummary;
      if (i + 1 < forecasts.length && forecasts[i + 1].tempHigh) {
        highTemp = parseFloat(forecasts[i + 1].tempHigh);
        dayIcon = forecasts[i + 1].iconCode;
        dayPop = Math.max(dayPop, forecasts[i + 1].pop);
        dayTextSummary = forecasts[i + 1].textSummary;
        i += 2;
      } else {
        i += 1;
      }
    } else {
      i += 1;
      continue;
    }

    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    daily.time.push(dateStr);
    daily.weather_code.push(ecIconToWMO[dayIcon] ?? 3);
    daily.temperature_2m_max.push(highTemp ?? (lowTemp ?? 0));
    daily.temperature_2m_min.push(lowTemp ?? (highTemp ?? 0));
    daily.precipitation_sum.push(0);
    daily.precipitation_probability.push(dayPop);
    daily.sunrise.push(sunrise);
    daily.sunset.push(sunset);
    daily.text_summary.push(dayTextSummary);
    daily.night_text_summary.push(nightTextSummary);
    dayOffset++;
  }

  // --- Build hourly forecast (pseudo-hourly from daily highs/lows) ---
  const hourly = {
    time: [],
    temperature_2m: [],
    weather_code: [],
    precipitation_probability: [],
    precipitation_mm: [],
    wind_speed_10m: [],
  };

  const nowHour = new Date();
  nowHour.setMinutes(0, 0, 0);
  const tzOffsetHours = tzOffset != null ? -tzOffset / 60 : 0;

  for (let h = 0; h < 48; h++) {
    const hourTime = new Date(nowHour.getTime() + h * 3600000);
    // Shift UTC to local for daily.time matching and temperature interpolation
    const localTime = new Date(hourTime.getTime() + tzOffsetHours * 3600000);
    const hourDateStr = `${localTime.getFullYear()}-${String(localTime.getMonth() + 1).padStart(2, '0')}-${String(localTime.getDate()).padStart(2, '0')}`;
    const hour = localTime.getHours();

    const dayIdx = daily.time.indexOf(hourDateStr);
    let highT = temperature, lowT = temperature;
    let dayCode = current.weather_code, dayPop = 0;

    if (dayIdx !== -1) {
      highT = daily.temperature_2m_max[dayIdx];
      lowT = daily.temperature_2m_min[dayIdx];
      dayCode = daily.weather_code[dayIdx];
      dayPop = daily.precipitation_probability[dayIdx];
    }

    // Cosine interpolation: min at 5am, max at 5pm (12h apart, 24h cycle)
    const hourAngle = ((hour - 5 + 24) % 24) * Math.PI / 12;
    let temp = lowT + (highT - lowT) * (1 - Math.cos(hourAngle)) / 2;
    // Use the actual observed current temperature for the first (current) hour
    // so the hourly card matches the main temperature display.
    if (h === 0) temp = temperature;

    hourly.time.push(hourTime.toISOString());
    hourly.temperature_2m.push(Math.round(temp * 10) / 10);
    hourly.weather_code.push(dayCode);
    hourly.precipitation_probability.push(dayPop);
    hourly.precipitation_mm.push(0);
    hourly.wind_speed_10m.push(windSpeed);
  }

  // --- Weather alerts/warnings ---
  const warningsMatch = xmlText.match(/<warnings>([\s\S]*?)<\/warnings>/);
  const wn = warningsMatch ? warningsMatch[1] : '';
  const alertEventRe = /<event([^>]*)>/g;
  const alerts = [];
  let alertMatch;
  while ((alertMatch = alertEventRe.exec(wn)) !== null) {
    const attrs = alertMatch[1];
    const type = (attrs.match(/type="([^"]*)"/) || [])[1] || '';
    const alertColourLevel = (attrs.match(/alertColourLevel="([^"]*)"/) || [])[1] || 'yellow';
    const description = (attrs.match(/description="([^"]*)"/) || [])[1] || '';
    const expiryTime = (attrs.match(/expiryTime="([^"]*)"/) || [])[1] || '';
    const url = (attrs.match(/url="([^"]*)"/) || [])[1] || '';
    if (description) {
      alerts.push({ type, color: alertColourLevel, description, expiryTime, url });
    }
  }

  return { current, daily, hourly, alerts };
}

// --- Air Quality Health Index (AQHI) ---

// --- Air Quality Health Index (AQHI) via Air Quality Ontario ---
// Source: https://www.airqualityontario.com Atom XML feed
// Ontario's 38-station network; coordinates hardcoded by site ID.

const AQO_FEED_URL = 'https://www.airqualityontario.com/press/xml_summary.php';
let aqoCache = null;
let aqoCacheTime = 0;

const AQO_STATIONS = {
  '47045': { name: 'Barrie', lat: 44.3894, lon: -79.6903 },
  '54012': { name: 'Belleville', lat: 44.1628, lon: -77.3832 },
  '46090': { name: 'Brampton', lat: 43.6867, lon: -79.7599 },
  '21005': { name: 'Brantford', lat: 43.1394, lon: -80.2644 },
  '44008': { name: 'Burlington', lat: 43.3255, lon: -79.7990 },
  '13001': { name: 'Chatham', lat: 42.4042, lon: -82.1855 },
  '56051': { name: 'Cornwall', lat: 45.0185, lon: -74.7282 },
  '49010': { name: 'Dorset', lat: 45.2218, lon: -78.8934 },
  '15020': { name: 'Grand Bend', lat: 43.3117, lon: -81.7759 },
  '28028': { name: 'Guelph', lat: 43.5468, lon: -80.2482 },
  '29000': { name: 'Hamilton Downtown', lat: 43.2557, lon: -79.8711 },
  '29214': { name: 'Hamilton Mountain', lat: 43.2175, lon: -79.8896 },
  '29118': { name: 'Hamilton West', lat: 43.2635, lon: -79.8919 },
  '52023': { name: 'Kingston', lat: 44.2312, lon: -76.4860 },
  '26060': { name: 'Kitchener', lat: 43.4516, lon: -80.4925 },
  '15026': { name: 'London', lat: 42.9849, lon: -81.2453 },
  '44029': { name: 'Milton', lat: 43.5183, lon: -79.8808 },
  '46108': { name: 'Mississauga', lat: 43.5890, lon: -79.6441 },
  '48006': { name: 'Newmarket', lat: 44.0592, lon: -79.4613 },
  '75010': { name: 'North Bay', lat: 46.3017, lon: -79.4608 },
  '44017': { name: 'Oakville', lat: 43.4675, lon: -79.6877 },
  '45027': { name: 'Oshawa', lat: 43.8971, lon: -78.8658 },
  '51001': { name: 'Ottawa Downtown', lat: 45.4215, lon: -75.6972 },
  '49005': { name: 'Parry Sound', lat: 45.3432, lon: -80.0323 },
  '59006': { name: 'Peterborough', lat: 44.3091, lon: -78.3197 },
  '16015': { name: 'Port Stanley', lat: 42.6276, lon: -81.2025 },
  '14111': { name: 'Sarnia', lat: 42.9745, lon: -82.4097 },
  '71078': { name: 'Sault Ste. Marie', lat: 46.5135, lon: -84.3336 },
  '27067': { name: 'St. Catharines', lat: 43.1594, lon: -79.2469 },
  '77233': { name: 'Sudbury', lat: 46.4917, lon: -81.0034 },
  '63200': { name: 'Thunder Bay', lat: 48.3809, lon: -89.2477 },
  '18007': { name: 'Tiverton', lat: 44.3044, lon: -81.5566 },
  '31129': { name: 'Toronto Downtown', lat: 43.6532, lon: -79.3832 },
  '33003': { name: 'Toronto East', lat: 43.6863, lon: -79.3389 },
  '34021': { name: 'Toronto North', lat: 43.7806, lon: -79.4392 },
  '35125': { name: 'Toronto West', lat: 43.6462, lon: -79.4856 },
  '12008': { name: 'Windsor Downtown', lat: 42.3175, lon: -83.0370 },
  '12016': { name: 'Windsor West', lat: 42.3145, lon: -83.0608 },
};

async function fetchAqhi(_province, lat, lon) {
  const now = Date.now();
  if (!aqoCache || (now - aqoCacheTime) > 600000) {
    const res = await fetch(AQO_FEED_URL);
    if (!res.ok) return null;
    const xml = await res.text();

    // Parse <entry> blocks with "Current Observation" in the title
    const entryRegex = /<entry>\s*<title><!\[CDATA\[(.+?): Current Observation\]\]><\/title>\s*<summary><!\[CDATA\[(.+?)\]\]><\/summary>[\s\S]*?sites=(\d+)/g;
    const stations = [];
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const name = match[1].trim();
      const summary = match[2].trim();
      const siteId = match[3];
      // Summary like "4 - Moderate Risk" or "10+ - Very High Risk"
      const valueMatch = summary.match(/^(\d+)(\+)?/);
      if (!valueMatch) continue;
      let value = parseInt(valueMatch[1]);
      if (valueMatch[2] === '+') value = 11; // 10+ maps to 11
      stations.push({ name, value, siteId });
    }
    aqoCache = stations;
    aqoCacheTime = now;
  }

  if (!aqoCache || aqoCache.length === 0) return null;

  // Find closest station within 200 km
  let closest = null;
  let minDist = Infinity;
  for (const s of aqoCache) {
    const coords = AQO_STATIONS[s.siteId];
    if (!coords) continue;
    const dist = haversine(lat, lon, coords.lat, coords.lon);
    if (dist < minDist) {
      minDist = dist;
      closest = { ...s, ...coords };
    }
  }
  if (!closest || minDist > 200) return null;

  return { value: closest.value, name: closest.name };
}

function convertSummaryToImperial(text) {
  if (!text) return text;
  let result = text;
  // Convert wind: "X km/h" → mph
  result = result.replace(/(\d+(?:\.\d+)?)\s*km\/h/gi, (_m, num) => {
    return `${Math.round(parseFloat(num) / 1.60934)} mph`;
  });
  // Convert temperatures after High/Low/Temperature keywords
  result = result.replace(/(High|Low|Temperature)\s+(\d+)/gi, (_m, kw, num) => {
    return `${kw} ${Math.round(parseFloat(num) * 9 / 5 + 32)}`;
  });
  return result;
}

const wkConditionToWMO = {
  'Clear': 0, 'MostlyClear': 1, 'PartlyCloudy': 2, 'MostlyCloudy': 2,
  'Cloudy': 3, 'Foggy': 45, 'Haze': 45,
  'LightDrizzle': 51, 'Drizzle': 53, 'HeavyDrizzle': 55,
  'LightRain': 61, 'Rain': 63, 'HeavyRain': 65,
  'ScatteredRain': 80, 'ScatteredShowers': 80, 'IsolatedShowers': 80,
  'MostlyCloudyShowers': 80, 'PartlyCloudyShowers': 80,
  'LightSnow': 71, 'Snow': 73, 'HeavySnow': 75,
  'ScatteredSnow': 85, 'LightFlurries': 85, 'ScatteredFlurries': 85,
  'Flurries': 85, 'HeavyFlurries': 86,
  'LightFreezingRain': 66, 'FreezingRain': 66, 'HeavyFreezingRain': 66,
  'LightFreezingDrizzle': 56, 'FreezingDrizzle': 56, 'HeavyFreezingDrizzle': 57,
  'Thunderstorms': 95, 'ScatteredThunderstorms': 95, 'IsolatedThunderstorms': 95,
  'StrongStorms': 99, 'MostlyCloudyThunderstorms': 95, 'PartlyCloudyThunderstorms': 95,
  'Hail': 95, 'LightHail': 95, 'HeavyHail': 99,
  'LightSleet': 73, 'Sleet': 75, 'HeavySleet': 75,
};

async function fetchWeatherKitHourly(lat, lon) {
  const teamId = Deno.env.get('WEATHERKIT_TEAM_ID');
  const serviceId = Deno.env.get('WEATHERKIT_SERVICE_ID');
  const keyId = Deno.env.get('WEATHERKIT_KEY_ID');
  const privateKeyPem = Deno.env.get('WEATHERKIT_PRIVATE_KEY');
  if (!teamId || !serviceId || !keyId || !privateKeyPem) return null;

  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT', id: `${teamId}.${serviceId}` })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setSubject(serviceId)
    .sign(key);

  const apiUrl = `https://weatherkit.apple.com/api/v1/weather/en/${lat}/${lon}?dataSets=forecastHourly&unit=m`;
  const res = await fetch(apiUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const wk = await res.json();
  const hours = wk.forecastHourly?.hours || [];
  const result = {};
  for (const h of hours) {
    if (h.forecastStart) {
      result[new Date(h.forecastStart).getTime()] = {
        precipitationAmount: h.precipitationAmount ?? 0,
        precipitationChance: h.precipitationChance ?? 0,
        conditionCode: h.conditionCode ?? null,
      };
    }
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { lat, lon, localDate, tzOffset, unit } = body;
    if (!lat || !lon) {
      return Response.json({ error: 'Missing lat/lon parameters' }, { status: 400 });
    }

    const sites = await getSiteList();
    const { site, distance } = findClosestSite(sites, lat, lon);
    if (!site) {
      return Response.json({ error: 'No weather station found' }, { status: 404 });
    }

    if (distance > 200) {
      return Response.json({
        error: 'Location appears to be outside Canada. Environment Canada data is only available for Canadian locations.'
      }, { status: 404 });
    }

    const xml = await fetchWeatherXml(site.province, site.code);
    const weatherData = parseWeatherXml(xml, localDate, tzOffset);

    try {
      if (site.province === 'ON') {
        const aqhi = await fetchAqhi(site.province, lat, lon);
        if (aqhi) weatherData.air_quality = aqhi;
      }
    } catch (e) {
      // AQHI is optional — don't fail the whole request
    }

    try {
      const wkHourly = await fetchWeatherKitHourly(lat, lon);
      if (wkHourly) {
        weatherData.hourly.time.forEach((t, idx) => {
          const ts = new Date(t).getTime();
          let bestMatch = null;
          let minDiff = Infinity;
          for (const [mapTs, val] of Object.entries(wkHourly)) {
            const diff = Math.abs(Number(mapTs) - ts);
            if (diff < minDiff) {
              minDiff = diff;
              bestMatch = val;
            }
          }
          if (bestMatch && minDiff < 3600000) {
            weatherData.hourly.precipitation_mm[idx] = Math.round(bestMatch.precipitationAmount * 10) / 10;
            weatherData.hourly.precipitation_probability[idx] = Math.round(bestMatch.precipitationChance * 100);
            if (bestMatch.conditionCode && wkConditionToWMO[bestMatch.conditionCode] != null) {
              weatherData.hourly.weather_code[idx] = wkConditionToWMO[bestMatch.conditionCode];
            }
          }
        });
      }
    } catch (e) {
      // WeatherKit hourly data is optional
    }

    // Override hourly weather codes for thunderstorm risk mentioned in EC night text summaries.
    // EC's night text for day D describes the overnight leading into D (evening of D-1 to morning of D).
    // WeatherKit often doesn't reflect thunderstorm risk that EC mentions in text, so we detect
    // "thunderstorm" in the night text and apply code 95 to overnight hours.
    const tzOffsetHours = tzOffset != null ? -tzOffset / 60 : 0;
    weatherData.hourly.time.forEach((t, idx) => {
      const hourDate = new Date(t);
      const localTime = new Date(hourDate.getTime() + tzOffsetHours * 3600000);
      const localHour = localTime.getHours();
      if (localHour < 8 || localHour >= 20) {
        // Overnight window: 8pm–8am. Find the day this night leads into.
        const nightDate = new Date(localTime);
        if (localHour >= 20) {
          nightDate.setDate(nightDate.getDate() + 1);
        }
        const nightDateStr = `${nightDate.getFullYear()}-${String(nightDate.getMonth() + 1).padStart(2, '0')}-${String(nightDate.getDate()).padStart(2, '0')}`;
        const nightIdx = weatherData.daily.time.indexOf(nightDateStr);
        if (nightIdx !== -1) {
          const nightText = (weatherData.daily.night_text_summary?.[nightIdx] || '').toLowerCase();
          if (nightText.includes('thunderstorm')) {
            weatherData.hourly.weather_code[idx] = 95;
          }
        }
      }
    });

    if (unit === 'fahrenheit') {
      weatherData.daily.text_summary = weatherData.daily.text_summary.map(convertSummaryToImperial);
      weatherData.daily.night_text_summary = weatherData.daily.night_text_summary.map(convertSummaryToImperial);
    }

    return Response.json(weatherData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});