// Weather unit conversion utilities
// Backend always returns metric: Celsius, km/h, mm, mbar

const cToF = (c) => (c * 9 / 5) + 32;
const kmhToMph = (kmh) => kmh / 1.60934;
const mmToInches = (mm) => mm / 25.4;
const kpaToInHg = (kpa) => kpa * 0.2953;

export const formatTemp = (celsius, unit) => {
  const val = unit === 'fahrenheit' ? cToF(celsius) : celsius;
  return Math.round(val);
};

export const formatWind = (kmh, unit) => {
  if (kmh == null) return '—';
  return unit === 'fahrenheit'
    ? `${Math.round(kmhToMph(kmh))}mph`
    : `${Math.round(kmh)}km/h`;
};

export const formatPrecip = (mm, unit) => {
  if (mm == null) return '—';
  return unit === 'fahrenheit'
    ? `${mmToInches(mm).toFixed(2)}"`
    : `${mm.toFixed(1)}mm`;
};

export const formatPressure = (kpa, unit) => {
  if (kpa == null) return '—';
  return unit === 'fahrenheit'
    ? `${kpaToInHg(kpa).toFixed(2)}inHg`
    : `${kpa.toFixed(1)}kPa`;
};

export const formatVisibility = (km, unit) => {
  if (km == null) return '—';
  return unit === 'fahrenheit'
    ? `${(km / 1.60934).toFixed(1)}mi`
    : `${km.toFixed(1)}km`;
};

// Maps a WMO weather code to a short text description.
export const getWeatherDescription = (code) => {
  const codes = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
    45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle',
    55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
    80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Light Snow Showers', 86: 'Snow Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Thunderstorm with Hail',
  };
  return codes[code] || 'Unknown';
};

// Reconciles the EC condition text with the WMO weather code so the
// description matches the icon. EC "thunderstorm risk" icon codes map to
// WMO 95-99, but the observed condition text may not mention thunder —
// this appends a thunderstorm note when the icon indicates one.
export const getConditionText = (condition, code) => {
  if (!condition) return getWeatherDescription(code);
  const lower = condition.toLowerCase();
  if (code >= 95 && code <= 99 && !lower.includes('thunder')) {
    return code >= 96
      ? `${condition} · Thunderstorm with Hail`
      : `${condition} · Thunderstorm Risk`;
  }
  return condition;
};