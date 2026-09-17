// Fish silhouette used for bite-rating icons (Home Fish Bite Rating
// and the Moon page's main, weekly, and hourly fish icons). The asset is a
// solid fish on a transparent background, applied as a mask so the
// silhouette picks up the surrounding text color (text-primary blue).
const FISH_IMG_URL =
  "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/2ee9889c3_whitebass.png";

export default function FishIcon({ className = "", style, ...props }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current shrink-0 ${className}`}
      style={{
        WebkitMaskImage: `url("${FISH_IMG_URL}")`,
        maskImage: `url("${FISH_IMG_URL}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
      {...props}
    />
  );
}