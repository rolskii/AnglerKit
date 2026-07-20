const FISH_IMG_URL =
  "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/552bbaffa_PermitWt.png";

export default function FishIcon({ className = "", ...props }) {
  return (
    <img
      src={FISH_IMG_URL}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
      style={{ filter: "brightness(0) saturate(100%) invert(12%) sepia(40%) saturate(2000%) hue-rotate(200deg) brightness(90%) contrast(95%)", transform: "scaleX(-1)" }}
      {...props}
    />
  );
}