import { base44 } from "@/api/base44Client";

export async function searchLocations(query, limit = 5, searchLocation = null) {
  if (!query || query.trim().length < 2) return [];
  const payload = { query, mode: "search", limit };
  if (searchLocation) payload.searchLocation = searchLocation;
  const res = await base44.functions.invoke("applemaps", payload);
  return res.data.results || [];
}

export async function geocodeLocation(name) {
  const res = await base44.functions.invoke("applemaps", { query: name, mode: "geocode" });
  return (res.data.results || [])[0] || null;
}