import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 20 28"
        width="28"
        height="28"
        fill="currentColor"
        className="text-primary"
        {...props}
      >
        {/* Round eye at top */}
        <circle cx="10" cy="2" r="1.5" />
        
        {/* Straight vertical shaft */}
        <rect x="9.2" y="3.8" width="1.6" height="10" rx="0.8" />
        
        {/* Smooth hook curve - large U bend at bottom */}
        <path d="M 9.2 13.8 Q 7.5 15.5 6 17.5 Q 4.5 19.5 4 21.5 Q 3.8 23.5 5.5 24 Q 7 24.5 8.5 22.5 Q 10 20 10.8 13.8 Z" />
        
        {/* Sharp barb triangle on left */}
        <polygon points="5,17.5 2,15 4,16.5" />
      </svg>
    </div>
  );
}