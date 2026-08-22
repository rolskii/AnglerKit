// Minimal EXIF reader for JPEG files — extracts the capture date/time and
// GPS coordinates from the EXIF block so uploaded catch photos can pre-fill
// the time and location automatically. Returns null for non-JPEG files or
// images with no usable EXIF. Browser-side only (no library dependency).

const TYPE_SIZES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function readIfd(view, ifdOffset, tiffStart, little) {
  const entries = {};
  if (ifdOffset + 2 > view.byteLength) return entries;
  const count = view.getUint16(ifdOffset, little);
  for (let i = 0; i < count; i++) {
    const entry = ifdOffset + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const cnt = view.getUint32(entry + 4, little);
    const typeSize = TYPE_SIZES[type] || 1;
    const total = cnt * typeSize;
    const valField = entry + 8;
    const dataOffset = total <= 4 ? valField : tiffStart + view.getUint32(valField, little);
    let value;
    switch (type) {
      case 2: { // ASCII
        let s = "";
        for (let b = 0; b < cnt; b++) {
          if (dataOffset + b >= view.byteLength) break;
          const c = view.getUint8(dataOffset + b);
          if (c === 0) break;
          s += String.fromCharCode(c);
        }
        value = s;
        break;
      }
      case 3: { // SHORT
        value = [];
        for (let b = 0; b < cnt; b++) value.push(view.getUint16(dataOffset + b * 2, little));
        if (cnt === 1) value = value[0];
        break;
      }
      case 4: { // LONG
        value = [];
        for (let b = 0; b < cnt; b++) value.push(view.getUint32(dataOffset + b * 4, little));
        if (cnt === 1) value = value[0];
        break;
      }
      case 5: { // RATIONAL
        value = [];
        for (let b = 0; b < cnt; b++) {
          const n = view.getUint32(dataOffset + b * 8, little);
          const d = view.getUint32(dataOffset + b * 8 + 4, little);
          value.push(d === 0 ? 0 : n / d);
        }
        if (cnt === 1) value = value[0];
        break;
      }
      default:
        value = null;
    }
    entries[tag] = value;
  }
  return entries;
}

function parseGps(gps) {
  if (!gps) return null;
  const lat = gps[2];
  const lon = gps[4];
  if (!Array.isArray(lat) || !Array.isArray(lon)) return null;
  const latDec = lat[0] + lat[1] / 60 + lat[2] / 3600;
  const lonDec = lon[0] + lon[1] / 60 + lon[2] / 3600;
  const latRef = gps[1];
  const lonRef = gps[3];
  return {
    lat: latRef === "S" ? -latDec : latDec,
    lon: lonRef === "W" ? -lonDec : lonDec,
  };
}

function parseDateTime(str) {
  if (!str) return null;
  const m = String(str).match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, Y, Mo, D, H, Mi] = m;
  return { date: `${Y}-${Mo}-${D}`, time: `${H}:${Mi}` };
}

export async function extractExif(file) {
  try {
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);
    if (view.byteLength < 4 || view.getUint16(0) !== 0xFFD8) return null;
    let offset = 2;
    let exifStart = null;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFD9 || (marker & 0xFF00) !== 0xFF00) break;
      const size = view.getUint16(offset + 2);
      if (marker === 0xFFE1) {
        const sig = String.fromCharCode(
          view.getUint8(offset + 4), view.getUint8(offset + 5),
          view.getUint8(offset + 6), view.getUint8(offset + 7)
        );
        if (sig === "Exif") { exifStart = offset + 10; break; }
      }
      offset += 2 + size;
    }
    if (exifStart == null) return null;
    const tiffStart = exifStart;
    const byteOrder = view.getUint16(tiffStart);
    const little = byteOrder === 0x4949;
    if (view.getUint16(tiffStart + 2, little) !== 0x002A) return null;
    const ifd0Offset = tiffStart + view.getUint32(tiffStart + 4, little);
    const ifd0 = readIfd(view, ifd0Offset, tiffStart, little);

    const exifIfdOffset = ifd0[0x8769];
    const exifIfd = exifIfdOffset ? readIfd(view, tiffStart + exifIfdOffset, tiffStart, little) : null;

    const gpsIfdOffset = ifd0[0x8825];
    const gpsIfd = gpsIfdOffset ? readIfd(view, tiffStart + gpsIfdOffset, tiffStart, little) : null;

    const dt = parseDateTime(exifIfd?.[0x9003] || exifIfd?.[0x9004] || ifd0[0x0132]);
    const gps = parseGps(gpsIfd);

    const result = {};
    if (dt) { result.date = dt.date; result.time = dt.time; }
    if (gps) { result.lat = gps.lat; result.lon = gps.lon; }
    return Object.keys(result).length ? result : null;
  } catch {
    return null;
  }
}