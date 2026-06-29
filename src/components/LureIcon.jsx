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
        {/* Eye loop at top */}
        <circle cx="12" cy="3" r="2.5" />
        
        {/* Vertical shaft */}
        <rect x="10.2" y="5.5" width="3.6" height="8.5" />
        
        {/* Curved hook base */}
        <path d="M 10.2 14 Q 6.5 17.5 3 23 Q 1.5 25 2.5 26 Q 4 27 6.5 24 Q 10 19.5 13.8 14 Z" />
        
        {/* Barb point on left */}
        <polygon points="3,19 0.5,15.5 2.5,17.5" />
      </svg>
    </div>
  );
}