import React from "react";

export default function LineSpoolIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* side flanges */}
      <path d="M4 5 V19" strokeWidth="2.6" />
      <path d="M20 5 V19" strokeWidth="2.6" />
      {/* wound line strokes */}
      <path d="M6 6 V18" strokeWidth="1.5" />
      <path d="M8 6 V18" strokeWidth="1.5" />
      <path d="M10 6 V18" strokeWidth="1.5" />
      <path d="M12 6 V18" strokeWidth="1.5" />
      <path d="M14 6 V18" strokeWidth="1.5" />
      <path d="M16 6 V18" strokeWidth="1.5" />
      <path d="M18 6 V18" strokeWidth="1.5" />
      {/* thread tail arcing off the right flange */}
      <path d="M20 5 C15 0 10 5 5 2.5" strokeWidth="1.5" />
    </svg>
  );
}