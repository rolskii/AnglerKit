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
      <path d="M12 2v8" />
      <path d="M12 10c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6c0-2.5 1.5-4.5 3.5-5.5" />
      <path d="M15 16l2 2" />
    </svg>
  );
}