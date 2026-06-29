export default function FishingHookIcon({ className = "" }) {
  return (
    <object
      data="https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/8eed12276_fishing-hook.svg"
      type="image/svg+xml"
      className={`w-8 h-8 ${className}`}
      style={{ filter: "invert(1) hue-rotate(150deg) saturate(1.5)" }}
    />
  );
}