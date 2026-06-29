import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="currentColor"
        className="text-primary"
        {...props}
      >
        {/* Filled hook shape */}
        <g>
          {/* Loop */}
          <circle cx="12" cy="3.5" r="2.2" />
          {/* Shaft - thick vertical line as rectangle */}
          <rect x="10.5" y="5.5" width="3" height="8" />
          {/* Curved hook bottom - thick curved path */}
          <path d="M 10.5 13.5 Q 7 16, 3.5 21 Q 2.5 22, 3 22.5 Q 4 22.5, 5.5 21 Q 9 16.5, 13.5 13.5 Z" />
        </g>
      </svg>
    </div>
  );
}