export default function FishingHookIcon({ className = "" }) {
  return (
    <object
      data="https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/8eed12276_fishing-hook.svg"
      type="image/svg+xml"
      className={`w-8 h-8 ${className}`}
      style={{ filter: "brightness(0) saturate(100%) invert(95%) sepia(70%) hue-rotate(170deg) saturate(2.5)" }}
    />
  );
}