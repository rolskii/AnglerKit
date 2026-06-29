export default function FishingHookIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v10" />
      <circle cx="12" cy="16" r="5" />
      <line x1="10" y1="21" x2="8" y2="24" />
      <line x1="14" y1="21" x2="16" y2="24" />
    </svg>
  );
}