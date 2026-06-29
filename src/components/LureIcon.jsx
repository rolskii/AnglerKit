import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <svg
        viewBox="0 0 20 24"
        width="28"
        height="28"
        fill="currentColor"
        className="text-primary"
        {...props}
      >
        {/* Lure body - teardrop/spoon shape */}
        <ellipse cx="10" cy="8" rx="5" ry="6" fill="currentColor" opacity="0.8" />
        
        {/* Eye */}
        <circle cx="10" cy="3" r="1.5" fill="currentColor" />
        
        {/* Hook eye connector */}
        <line x1="10" y1="4.5" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Hook shaft */}
        <line x1="10" y1="14" x2="10" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Hook curve */}
        <path d="M 10 19 Q 6 20.5 4 23 Q 3.5 23.5 5 23.8 Q 7 23.5 9 21.5 Q 10 20 10 19" fill="currentColor" />
        
        {/* Barb */}
        <line x1="4" y1="23" x2="2" y2="21.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}