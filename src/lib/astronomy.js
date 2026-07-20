// Low-precision sun & moon position/rise-set calculations, used to compute
// real (not hardcoded) sunrise/solar-noon/sunset and moonrise/moon-transit/
// moonset times for the Moon page's solunar tables and footer.
//
// Based on standard, widely-published low-precision solar/lunar position
// formulas (Jean Meeus, "Astronomical Algorithms"; Astronomy Answers by
// Arnold Barmettler). Accurate to within a few minutes, which is more than
// sufficient for fishing solunar windows.

const RAD = Math.PI / 180;
const DAY_MS = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = RAD * 23.4397; // earth's axial tilt

function toJulian(date) {
  return date.valueOf() / DAY_MS - 0.5 + J1970;
}
function fromJulian(j) {
  return new Date((j + 0.5 - J1970) * DAY_MS);
}
function toDays(date) {
  return toJulian(date) - J2000;
}

function rightAscension(l, b) {
  return Math.atan2(
    Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY),
    Math.cos(l)
  );
}
function declination(l, b) {
  return Math.asin(
    Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l)
  );
}
function siderealTime(d, lw) {
  return RAD * (280.16 + 360.9856235 * d) - lw;
}
function azimuthOf(H, phi, dec) {
  return Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
}
function altitudeOf(H, phi, dec) {
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
}
function hourAngleFor(h, phi, dec) {
  return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
}

// --- Sun ---

function solarMeanAnomaly(d) {
  return RAD * (357.5291 + 0.98560028 * d);
}
function eclipticLongitude(M) {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
}
function sunCoords(d) {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}
function julianCycle(d, lw) {
  return Math.round(d - 0.0009 - lw / (2 * Math.PI));
}
function approxTransit(Ht, lw, n) {
  return 0.0009 + (Ht + lw) / (2 * Math.PI) + n;
}
function solarTransitJ(ds, M, L) {
  return J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
}
function getSetJ(h, lw, phi, dec, n, M, L) {
  const w = hourAngleFor(h, phi, dec);
  const a = approxTransit(w, lw, n);
  return solarTransitJ(a, M, L);
}

/** Real sunrise / solar noon / sunset for a given calendar date + coords. */
export function getSunTimes(date, lat, lon) {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const h0 = -0.833 * RAD; // standard sunrise/sunset altitude (accounts for refraction + solar radius)
  const Jset = getSetJ(h0, lw, phi, dec, n, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);

  return {
    sunrise: fromJulian(Jrise),
    solarNoon: fromJulian(Jnoon),
    sunset: fromJulian(Jset),
  };
}

// --- Moon ---

function moonCoords(d) {
  const L = RAD * (218.316 + 13.176396 * d);
  const M = RAD * (134.963 + 13.064993 * d);
  const F = RAD * (93.272 + 13.22935 * d);

  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);

  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

function getMoonPosition(date, lat, lon) {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = toDays(date);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  const h = altitudeOf(H, phi, c.dec);
  return { azimuth: azimuthOf(H, phi, c.dec), altitude: h, distance: c.dist };
}

/** Moon phase (0-1, 0=new, 0.5=full) and illuminated fraction (0-1). */
export function getMoonIllumination(date) {
  const d = toDays(date || new Date());
  const s = sunCoords(d);
  const m = moonCoords(d);
  const sdist = 149598000;
  const phi = Math.acos(
    Math.sin(s.dec) * Math.sin(m.dec) + Math.cos(s.dec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra)
  );
  const inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(s.dec) * Math.sin(s.ra - m.ra),
    Math.sin(s.dec) * Math.cos(m.dec) - Math.cos(s.dec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra)
  );
  const fraction = (1 + Math.cos(inc)) / 2;
  const phase = 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI;
  return { phase, fraction, angle };
}

function hoursLater(date, h) {
  return new Date(date.valueOf() + h * 60 * 60 * 1000);
}

/** Moonrise / moonset for the given calendar date + coords (may be absent if the moon doesn't rise/set that day). */
export function getMoonTimes(date, lat, lon) {
  const t = new Date(date);
  t.setHours(0, 0, 0, 0);
  const hc = 0.133 * RAD;
  let h0 = getMoonPosition(t, lat, lon).altitude - hc;
  let rise, set, ye = 0;

  for (let i = 1; i <= 24; i += 2) {
    const h1 = getMoonPosition(hoursLater(t, i), lat, lon).altitude - hc;
    const h2 = getMoonPosition(hoursLater(t, i + 1), lat, lon).altitude - hc;

    const a = (h0 + h2) / 2 - h1;
    const b = (h2 - h0) / 2;
    const xe = -b / (2 * a);
    const ye2 = (a * xe + b) * xe + h1;
    const d = b * b - 4 * a * h1;
    let roots = 0;
    let x1, x2;

    if (d >= 0) {
      const dx = Math.sqrt(d) / (Math.abs(a) * 2);
      x1 = xe - dx;
      x2 = xe + dx;
      if (Math.abs(x1) <= 1) roots++;
      if (Math.abs(x2) <= 1) roots++;
      if (x1 < -1) x1 = x2;
    }

    if (roots === 1) {
      if (h0 < 0) rise = i + x1;
      else set = i + x1;
    } else if (roots === 2) {
      rise = i + (ye2 < 0 ? x2 : x1);
      set = i + (ye2 < 0 ? x1 : x2);
    }

    ye = ye2;
    if (rise !== undefined && set !== undefined) break;
    h0 = h2;
  }

  const result = {};
  if (rise !== undefined) result.rise = hoursLater(t, rise);
  if (set !== undefined) result.set = hoursLater(t, set);
  if (rise === undefined && set === undefined) {
    result.alwaysUp = ye > 0;
    result.alwaysDown = ye <= 0;
  }
  return result;
}

/** Time of the moon's highest point (meridian transit / culmination) during the given calendar day. */
export function getMoonTransit(date, lat, lon) {
  const t = new Date(date);
  t.setHours(0, 0, 0, 0);
  let bestTime = t;
  let bestAlt = -Infinity;
  for (let m = 0; m <= 24 * 60; m += 10) {
    const candidate = new Date(t.valueOf() + m * 60000);
    const alt = getMoonPosition(candidate, lat, lon).altitude;
    if (alt > bestAlt) {
      bestAlt = alt;
      bestTime = candidate;
    }
  }
  return bestTime;
}

const MOON_MONTH = 29.53058867;

/** Name + days-into-cycle for the moon phase fraction (0-1) returned by getMoonIllumination. */
export function getMoonPhaseName(phase) {
  const daysInCycle = phase * MOON_MONTH;
  if (daysInCycle < 1.84) return 'New Moon';
  if (daysInCycle < 7.38) return 'Waxing Crescent';
  if (daysInCycle < 9.23) return 'First Quarter';
  if (daysInCycle < 14.77) return 'Waxing Gibbous';
  if (daysInCycle < 16.61) return 'Full Moon';
  if (daysInCycle < 23.15) return 'Waning Gibbous';
  if (daysInCycle < 25) return 'Last Quarter';
  return 'Waning Crescent';
}

export function formatTime(date) {
  if (!date) return null;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
