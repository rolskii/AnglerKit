export default function FishingHookIcon({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 2v10" />
      <circle cx="12" cy="16" r="5" />
      <path d="M14 19l3 3" />
    </svg>
  );
}