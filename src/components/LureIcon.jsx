import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 22 30"
        width="28"
        height="28"
        fill="currentColor"
        className="text-primary"
        {...props}
      >
        {/* Eye circle */}
        <circle cx="11" cy="2.5" r="2" />
        
        {/* Vertical shaft */}
        <rect x="9.75" y="4.5" width="2.5" height="10.5" />
        
        {/* Smooth J-curve for hook - stroke-like appearance */}
        <path d="M 9.75 15 Q 6.5 17 4 20 Q 2 22.5 3 24.5 Q 4.5 26.5 7 25 Q 10 23 11.25 15 Z" />
        
        {/* Sharp left barb */}
        <polygon points="4.5,18 1.5,16 3.5,17.5" />
      </svg>
    </div>
  );
}