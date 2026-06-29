import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        {...props}
      >
        {/* Loop at top */}
        <circle cx="12" cy="4" r="2" />
        {/* Shaft */}
        <path d="M 12 6 L 12 14" />
        {/* Curved hook bottom */}
        <path d="M 12 14 Q 5 16, 4 22" />
      </svg>
    </div>
  );
}