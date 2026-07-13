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
    const temp = lowT + (highT - lowT) * (1 - Math.cos(hourAngle)) / 2;

    hourly.time.push(hourTime.toISOString());
    hourly.temperature_2m.push(Math.round(temp * 10) / 10);
    hourly.weather_code.push(dayCode);
    hourly.precipitation_probability.push(dayPop);
    hourly.wind_speed_10m.push(windSpeed);
  }

  return { current, daily, hourly };
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

    if (unit === 'fahrenheit') {
      weatherData.daily.text_summary = weatherData.daily.text_summary.map(convertSummaryToImperial);
      weatherData.daily.night_text_summary = weatherData.daily.night_text_summary.map(convertSummaryToImperial);
    }

    return Response.json(weatherData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});