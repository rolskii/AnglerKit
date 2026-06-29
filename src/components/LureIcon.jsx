import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 20 28"
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
        {/* Eye */}
        <circle cx="10" cy="2" r="1.5" fill="currentColor" />
        
        {/* Shaft */}
        <line x1="10" y1="3.5" x2="10" y2="12" />
        
        {/* Hook curve - J shape */}
        <path d="M 10 12 Q 5 14 3 18 Q 2 20 4 23 Q 6 25 9 23 Q 12 20 10 12" />
        
        {/* Barb */}
        <line x1="3" y1="18" x2="0.5" y2="15.5" />
      </svg>
    </div>
  );
}