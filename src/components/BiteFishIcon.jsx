// Jumping-fish silhouette used for bite-rating icons (Home Fish Bite Rating
// and the Moon page's main, weekly, and hourly fish icons). The asset is a
// black fish on a white JPG background, so mix-blend-mode multiply lets the
// card background show through everywhere the white pixels are.
const FISH_IMG_URL =
  "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/3ca05e674_AppLogoHeron.jpg";

export default function FishIcon({ className = "", ...props }) {
  return (
    <img
      src={FISH_IMG_URL}
      crossOrigin="anonymous"
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
      style={{ mixBlendMode: "multiply" }}
      {...props}
    />
  );
}