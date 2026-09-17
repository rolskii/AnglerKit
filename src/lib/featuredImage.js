import { base44 } from "@/api/base44Client";

const LEGACY_KEY = "starredPhotos";
const MIGRATED_KEY = "starredPhotosMigrated";

// One-time migration: photos starred in this browser were previously kept in
// local storage (which is lost on device/browser/address changes). Copy them
// into the account database once, then stop using local storage.
async function migrateLegacy() {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
    if (Array.isArray(legacy) && legacy.length > 0) {
      const existing = await base44.entities.StarredPhoto.list();
      const fresh = legacy
        .filter((p) => p && p.image_url && !existing.some((e) => e.image_url === p.image_url))
        .map((p) => ({
          image_url: p.image_url,
          label: p.label || "",
          subtitle: p.subtitle || "",
          link: p.link || "",
        }));
      if (fresh.length > 0) await base44.entities.StarredPhoto.bulkCreate(fresh);
    }
    localStorage.setItem(MIGRATED_KEY, "1");
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}

// Starred photos live in the database, tied to the signed-in account.
export async function getStarredPhotos() {
  try {
    await migrateLegacy();
    const records = await base44.entities.StarredPhoto.list("-created_date", 500);
    return records
      .filter((p) => p.image_url)
      .map(({ image_url, label, subtitle, link }) => ({ image_url, label, subtitle, link }));
  } catch {
    return [];
  }
}

export async function isStarredPhoto(url) {
  const list = await getStarredPhotos();
  return list.some((p) => p.image_url === url);
}

// Adds the photo to the starred group if it isn't starred yet, removes it if
// it is. Returns true when the photo is starred after the call.
export async function toggleStarredPhoto(imageData) {
  if (!imageData || !imageData.image_url) return false;
  await migrateLegacy();
  const existing = await base44.entities.StarredPhoto.filter({ image_url: imageData.image_url });
  const starred = existing.length === 0;
  if (starred) {
    await base44.entities.StarredPhoto.create({
      image_url: imageData.image_url,
      label: imageData.label || "",
      subtitle: imageData.subtitle || "",
      link: imageData.link || "",
    });
  } else {
    for (const rec of existing) await base44.entities.StarredPhoto.delete(rec.id);
  }
  window.dispatchEvent(new Event("featured-image-changed"));
  return starred;
}