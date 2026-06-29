export default function FishingHookIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="hsl(170, 70%, 32%)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-8 h-8 ${className}`}
    >
      <path d="M12 2v8" />
      <path d="M12 10c3.314 0 6 2.686 6 6 0 3.314-2.686 6-6 6-3.314 0-6-2.686-6-6 0-1.5.56-2.868 1.475-3.9" />
      <path d="M8.9 13.2l-1.414 1.414" />
    </svg>
  );
}