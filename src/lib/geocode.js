export async function searchLocations(query, limit = 5) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`
  );
  const data = await res.json();
  return data.map(r => {
    const city = r.address?.city || r.address?.town || r.address?.village || r.address?.hamlet || r.name || r.display_name.split(',')[0];
    const parts = [city];
    if (r.address?.state) parts.push(r.address.state);
    if (r.address?.country) parts.push(r.address.country);
    return {
      name: parts.join(', '),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    };
  });
}

export async function geocodeLocation(name) {
  const results = await searchLocations(name, 1);
  return results[0] || null;
}