/**
 * Inline SVG fish glyph. Uses `currentColor` so it follows text color classes
 * (e.g. `text-primary`) and renders reliably in html2canvas exports —
 * unlike the previous remote PNG, which was dropped from shared screenshots
 * because cross-origin images can't be captured without CORS headers.
 */
export default function FishIcon({ className = "", style, ...props }) {
  return (
    <svg
      viewBox="0 0 64 32"
      className={className}
      style={style}
      aria-hidden="true"
      {...props}
    >
      <path
        fill="currentColor"
        d="M3 16C9 7 19 3 30 3c8 0 14 2 19 7 4-4 9-6 13-6-2 4-3 7-3 12s1 8 3 12c-4 0-9-2-13-6-5 5-11 7-19 7-11 0-21-4-27-13z"
      />
      <path
        fill="currentColor"
        d="M44 6l14-4-3 9 3 9-14-4z"
        opacity="0.85"
      />
      <circle cx="35" cy="13" r="2.2" fill="#ffffff" />
      <path
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M21 11c4 3 4 8 0 11"
        opacity="0.45"
      />
    </svg>
  );
}