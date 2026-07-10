// Weather unit conversion utilities
// Backend always returns metric: Celsius, km/h, mm, mbar

const cToF = (c) => (c * 9 / 5) + 32;
const kmhToMph = (kmh) => kmh / 1.60934;
const mmToInches = (mm) => mm / 25.4;
const mbarToInHg = (mbar) => mbar * 0.02953;

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

export const formatPressure = (mbar, unit) => {
  if (mbar == null) return '—';
  return unit === 'fahrenheit'
    ? `${mbarToInHg(mbar).toFixed(2)}inHg`
    : `${(mbar / 10).toFixed(1)}kPa`;
};

export const formatVisibility = (km, unit) => {
  if (km == null) return '—';
  return unit === 'fahrenheit'
    ? `${(km / 1.60934).toFixed(1)}mi`
    : `${km.toFixed(1)}km`;
};