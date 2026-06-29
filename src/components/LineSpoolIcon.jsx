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
      <g transform="translate(12 12) scale(1.12) translate(-12 -12)">
        {/* side flanges */}
        <path d="M4 4.5 V19.5" strokeWidth="3" />
        <path d="M20 4.5 V19.5" strokeWidth="3" />
        {/* wound line strokes */}
        <path d="M6 6 V18" strokeWidth="2" />
        <path d="M8 6 V18" strokeWidth="2" />
        <path d="M10 6 V18" strokeWidth="2" />
        <path d="M12 6 V18" strokeWidth="2" />
        <path d="M14 6 V18" strokeWidth="2" />
        <path d="M16 6 V18" strokeWidth="2" />
        <path d="M18 6 V18" strokeWidth="2" />
        {/* thread tail arcing off the right flange */}
        <path d="M20 4.5 C15 -0.5 10 5 4.5 2" strokeWidth="2" />
      </g>
    </svg>
  );
}