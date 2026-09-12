// Fetches an image URL and converts it to a base64 data URL so it can be
// embedded inside a shared HTML card. Remote <img> sources are blocked in
// some file previews (e.g. iOS Quick Look), but data URLs always render.
export async function fetchAsDataUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}