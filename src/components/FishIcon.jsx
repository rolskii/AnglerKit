export default function FishIcon({ className = "", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 12c3-4 7-6 12-6 3 0 6 2 6 6s-3 6-6 6c-5 0-9-2-12-6Z" />
      <path d="M3 12l-2-2v4l2-2Z" />
      <circle cx="15" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}