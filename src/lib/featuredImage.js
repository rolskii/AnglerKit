export function setFeaturedImage(imageData) {
  localStorage.setItem("featuredImageUser", JSON.stringify(imageData));
  window.dispatchEvent(new Event("featured-image-changed"));
}

export function clearFeaturedImage() {
  localStorage.removeItem("featuredImageUser");
  window.dispatchEvent(new Event("featured-image-changed"));
}