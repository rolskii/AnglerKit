export default function FishingHookIcon({ className = "" }) {
  return (
    <img
      src="https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/8eed12276_fishing-hook.svg"
      alt="Fishing Hook"
      className={`w-8 h-8 ${className}`}
      style={{ filter: "invert(35%) sepia(60%) saturate(1.2) hue-rotate(170deg)" }}
    />
  );
}