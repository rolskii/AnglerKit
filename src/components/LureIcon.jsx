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
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        {...props}
      >
        {/* Hook shaft */}
        <path d="M 12 3 Q 12 8, 12 12 Q 12 16, 16 18 Q 18 19, 19 20" />
        {/* Barb */}
        <path d="M 19 20 L 20.5 19" />
        {/* Eyelet */}
        <circle cx="12" cy="3" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}