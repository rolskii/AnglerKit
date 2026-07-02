const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const toJD = (date) => date.getTime() / 86400000 + 2440587.5;

const moonEquatorial = (jd) => {
  const d = jd - 2451543.5;

  const N = ((125.1228 - 0.0529538083 * d) % 360 + 360) % 360;
  const i = 5.1454;
  const w = ((318.0634 + 0.1643573223 * d) % 360 + 360) % 360;
  const a = 60.2666;
  const e = 0.054900;
  const M = ((115.3654 + 13.0649929509 * d) % 360 + 360) % 360;

  let E = M;
  for (let k = 0; k < 8; k++) {
    E = E - (E - e * DEG * Math.sin(E * RAD) - M) / (1 - e * Math.cos(E * RAD));
  }

  const xv = a * (Math.cos(E * RAD) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
  const v = Math.atan2(yv, xv) * DEG;
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh = r * (Math.cos(N * RAD) * Math.cos((v + w) * RAD) - Math.sin(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
  const yh = r * (Math.sin(N * RAD) * Math.cos((v + w) * RAD) + Math.cos(N * RAD) * Math.sin((v + w) * RAD) * Math.cos(i * RAD));
  const zh = r * Math.sin((v + w) * RAD) * Math.sin(i * RAD);

  let lonecl = Math.atan2(yh, xh) * DEG;
  let latecl = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * DEG;

  const Ms = ((356.0470 + 0.9856002585 * d) % 360 + 360) % 360;
  const Ls = (282.9404 + Ms) % 360;
  const Lm = (N + w + M) % 360;
  const D = ((Lm - Ls) % 360 + 360) % 360;
  const F = ((Lm - N) % 360 + 360) % 360;

  lonecl += -1.274 * Math.sin((M - 2 * D) * RAD)
    + 0.658 * Math.sin(2 * D * RAD)
    - 0.186 * Math.sin(Ms * RAD)
    - 0.059 * Math.sin((2 * M - 2 * D) * RAD)
    - 0.057 * Math.sin((M - 2 * D + Ms) * RAD)
    + 0.053 * Math.sin((M + 2 * D) * RAD)
    + 0.046 * Math.sin((2 * D - Ms) * RAD)
    + 0.041 * Math.sin((M - Ms) * RAD)
    - 0.035 * Math.sin(D * RAD)
    - 0.031 * Math.sin((M + Ms) * RAD)
    - 0.015 * Math.sin((2 * F - 2 * D) * RAD)
    + 0.011 * Math.sin((M - 4 * D) * RAD);

  latecl += -0.173 * Math.sin((4 * D - M) * RAD)
    - 0.055 * Math.sin((M + 2 * D) * RAD)
    - 0.046 * Math.sin((2 * D - Ms) * RAD)
    + 0.033 * Math.sin((M - 2 * D) * RAD)
    + 0.017 * Math.sin((2 * M + 2 * D) * RAD);

  lonecl = (lonecl % 360 + 360) % 360;

  const xg = r * Math.cos(lonecl * RAD) * Math.cos(latecl * RAD);
  const yg = r * Math.sin(lonecl * RAD) * Math.cos(latecl * RAD);
  const zg = r * Math.sin(latecl * RAD);

  const ecl = 23.4393 - 0.0000004 * d;

  const xeq = xg;
  const yeq = yg * Math.cos(ecl * RAD) - zg * Math.sin(ecl * RAD);
  const zeq = yg * Math.sin(ecl * RAD) + zg * Math.cos(ecl * RAD);

  const RA = (Math.atan2(yeq, xeq) * DEG + 360) % 360;
  const Dec = Math.atan2(zeq, Math.sqrt(xeq * xeq + yeq * yeq)) * DEG;

  return { RA, Dec };
};

const moonAltitude = (jd, lat, lon) => {
  const { RA, Dec } = moonEquatorial(jd);
  let GMST = (280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360;
  if (GMST < 0) GMST += 360;
  const LST = (GMST + lon) % 360;
  const HA = LST - RA;
  return Math.asin(
    Math.sin(lat * RAD) * Math.sin(Dec * RAD) +
    Math.cos(lat * RAD) * Math.cos(Dec * RAD) * Math.cos(HA * RAD)
  ) * DEG;
};

export const getMoonTimes = (date, lat, lon) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const stepMin = 10;
  const samples = [];
  for (let min = 0; min <= 24 * 60; min += stepMin) {
    const t = new Date(dayStart.getTime() + min * 60000);
    samples.push({ min, alt: moonAltitude(toJD(t), lat, lon) });
  }

  let moonrise = null, moonset = null;
  let transit = null, maxAlt = -Infinity;
  let underfoot = null, minAlt = Infinity;

  for (let i = 0; i < samples.length; i++) {
    if (samples[i].alt > maxAlt) {
      maxAlt = samples[i].alt;
      transit = samples[i].min;
    }
    if (samples[i].alt < minAlt) {
      minAlt = samples[i].alt;
      underfoot = samples[i].min;
    }
  }

  for (let i = 0; i < samples.length - 1; i++) {
    if (samples[i].alt <= 0 && samples[i + 1].alt > 0) {
      const frac = -samples[i].alt / (samples[i + 1].alt - samples[i].alt);
      moonrise = samples[i].min + stepMin * frac;
    }
    if (samples[i].alt >= 0 && samples[i + 1].alt < 0) {
      const frac = samples[i].alt / (samples[i].alt - samples[i + 1].alt);
      moonset = samples[i].min + stepMin * frac;
    }
  }

  return { moonrise, moonset, transit, underfoot };
};