import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 24 32"
        width="28"
        height="28"
        fill="currentColor"
        className="text-primary"
        {...props}
      >
        {/* Eye circle */}
        <circle cx="12" cy="3" r="2" />
        
        {/* Shaft */}
        <rect x="10.5" y="5" width="3" height="9" />
        
        {/* Hook curve bottom - thick U shape */}
        <path d="M 10.5 14 Q 7 17 3.5 22 Q 2 24 4 25.5 Q 6 27 8.5 24 Q 12 19 13.5 14 Z" />
        
        {/* Left barb point */}
        <polygon points="4,18 1,15.5 3.5,17" />
      </svg>
    </div>
  );
}