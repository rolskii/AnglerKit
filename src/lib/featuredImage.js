const STARRED_KEY = "starredPhotos";

let migrated = false;

// One-time migration: the old system stored a single "featured" photo —
// carry it over so it becomes the first starred photo.
function migrateLegacy() {
  if (migrated) return;
  migrated = true;
  try {
    const legacy = JSON.parse(localStorage.getItem("featuredImageUser") || "null");
    if (legacy && legacy.image_url) {
      const list = getStarredPhotos();
      if (!list.some((p) => p.image_url === legacy.image_url)) {
        localStorage.setItem(STARRED_KEY, JSON.stringify([...list, legacy]));
      }
      localStorage.removeItem("featuredImageUser");
      localStorage.removeItem("featuredImageDaily");
    }
  } catch {}
}

export function getStarredPhotos() {
  migrateLegacy();
  try {
    const stored = JSON.parse(localStorage.getItem(STARRED_KEY));
    if (!Array.isArray(stored)) return [];
    return stored.filter((p) => p && p.image_url);
  } catch {
    return [];
  }
}

export function isStarredPhoto(url) {
  return getStarredPhotos().some((p) => p.image_url === url);
}

// Adds the photo to the starred group if it isn't starred yet, removes it if
// it is. Returns true when the photo is starred after the call.
export function toggleStarredPhoto(imageData) {
  if (!imageData || !imageData.image_url) return false;
  const list = getStarredPhotos();
  const idx = list.findIndex((p) => p.image_url === imageData.image_url);
  const starred = idx < 0;
  const updated = starred ? [...list, imageData] : list.filter((_, i) => i !== idx);
  localStorage.setItem(STARRED_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("featured-image-changed"));
  return starred;
}