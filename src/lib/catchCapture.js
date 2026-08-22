// Helpers for the Fish Log photo capture flow: geolocation, reverse
// geocoding, local-weather summarisation, and AI species identification.
import { base44 } from "@/api/base44Client";
import { formatTemp, formatWind, getWeatherDescription } from "@/lib/weatherUnits";

// Resolves to { lat, lon } or null if permission is denied / unavailable.
export function getPosition() {
  return new Promise((resolve) => {
    if (!navigator?.geolocation?.getCurrentPosition) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

// Free, key-less, CORS-enabled client reverse geocoder. Returns a readable
// "City, Region, Country"-style string, or null on failure.
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const d = await res.json();
    const parts = [d.city || d.locality, d.principalSubdivision, d.countryName].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

function buildConditions(current, isMetric) {
  if (!current) return null;
  const unit = isMetric ? "celsius" : "fahrenheit";
  const desc = getWeatherDescription(current.weather_code);
  const temp = formatTemp(current.temperature_2m, unit);
  const gust = current.wind_gust_10m != null ? formatWind(current.wind_gust_10m, unit) : null;
  const parts = [desc, `${temp}°`, gust ? `wind gusts ${gust}` : null].filter(Boolean);
  return parts.join(", ");
}

// Fetches current local weather via the app's WeatherKit backend and renders a
// brief summary string, e.g. "Partly Cloudy, 18°, wind gusts 25km/h".
export async function fetchCurrentWeather(lat, lon, isMetric) {
  try {
    const res = await base44.functions.invoke("weatherkit", { lat, lon });
    const current = res?.data?.current ?? res?.current;
    return buildConditions(current, isMetric);
  } catch {
    return null;
  }
}

const CATCH_PHOTO_SCHEMA = {
  type: "object",
  properties: {
    species: { type: "string", description: "Common name of the fish species, e.g. 'Brook Trout'." },
    conditions: {
      type: "string",
      description:
        "Brief weather/sky conditions inferred from the photo's background (sky, lighting, " +
        "wetness). One short phrase such as 'Sunny', 'Partly cloudy', 'Overcast', 'Light drizzle', " +
        "'Heavy rain', 'Foggy', 'Clear'. Only describe what's clearly visible; omit if unsure.",
    },
    confidence: { type: "number" },
  },
  required: ["species"],
};

const CATCH_PHOTO_PROMPT =
  "These photos show a caught fish. Do two things: (1) Identify the species using its common " +
  "name (e.g. 'Brook Trout', 'Rainbow Trout', 'Smallmouth Bass', 'Largemouth Bass', 'Northern Pike', " +
  "'Walleye', 'Brown Trout', 'Steelhead', 'Atlantic Salmon', 'Carp', 'Gar', 'Muskie'). Give your best " +
  "guess if uncertain. (2) Describe the apparent weather/sky conditions visible in the photo's " +
  "background as one short phrase (e.g. 'Sunny', 'Partly cloudy', 'Overcast', 'Light drizzle').";

// Runs the catch-photo scan on one or more uploaded photo URLs. Returns
// { species, conditions } — either may be null.
export async function analyzeCatchPhoto(fileUrls) {
  try {
    const urls = (Array.isArray(fileUrls) ? fileUrls : [fileUrls]).filter(Boolean);
    if (!urls.length) return {};
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: CATCH_PHOTO_PROMPT,
      file_urls: urls,
      response_json_schema: CATCH_PHOTO_SCHEMA,
    });
    const data = res?.output ?? res?.data ?? res ?? {};
    const obj = typeof data === "string" ? { species: data } : data;
    const species = obj.species && typeof obj.species === "string" ? obj.species.trim() : null;
    const conditions = obj.conditions && typeof obj.conditions === "string" ? obj.conditions.trim() : null;
    return { species, conditions };
  } catch {
    return {};
  }
}