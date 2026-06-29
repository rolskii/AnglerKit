import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 20 26"
        width="28"
        height="28"
        fill="currentColor"
        className="text-primary"
        {...props}
      >
        {/* Round eye at top */}
        <circle cx="10" cy="2" r="1.8" />
        
        {/* Vertical shaft - thick line */}
        <path d="M 9 4 L 9 13 Q 9 13.5 9.5 13.5 L 10.5 13.5 Q 11 13.5 11 13 L 11 4 Q 11 3.5 10.5 3.5 L 9.5 3.5 Q 9 3.5 9 4 Z" />
        
        {/* Main hook curve - smooth U shape */}
        <path d="M 9 13.5 Q 6.5 15.5 4.5 19 Q 3 21 3.8 22.5 Q 4.5 23.5 6 22 Q 8 20 11 13.5 Z" />
        
        {/* Barb point - sharp triangle */}
        <polygon points="4.5,17 2.5,15 4,16" />
      </svg>
    </div>
  );
}