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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        {...props}
      >
        {/* Eye */}
        <circle cx="10" cy="2" r="1.5" fill="currentColor" />
        
        {/* Hook shaft */}
        <line x1="10" y1="3.5" x2="10" y2="11" />
        
        {/* Thread wraps */}
        <line x1="9" y1="5" x2="11" y2="5" />
        <line x1="9" y1="7" x2="11" y2="7" />
        <line x1="9" y1="9" x2="11" y2="9" />
        
        {/* Hook curve */}
        <path d="M 10 11 Q 5 13 3 17 Q 2 19 4 22 Q 6 24 9 22 Q 12 19 10 11" />
        
        {/* Barb */}
        <line x1="3" y1="17" x2="0.5" y2="14.5" />
        
        {/* Feather/tail strokes */}
        <path d="M 8 15 Q 6 14 5 12" />
        <path d="M 10 16 Q 8 15 7 13" />
      </svg>
    </div>
  );
}