const FISH_IMG_URL =
  "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/552bbaffa_PermitWt.png";

export default function FishIcon({ className = "", ...props }) {
  return (
    <img
      src={FISH_IMG_URL}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
      {...props}
    />
  );
}