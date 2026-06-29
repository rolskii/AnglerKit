import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* lure body - filled crankbait shape */}
      <path d="M 5 10 Q 5 8 8 7 L 18 7 Q 20 7 20 10 Q 20 13 18 14 L 8 14 Q 5 13 5 10 Z" fill="currentColor" />
      
      {/* eye - white circle */}
      <circle cx="18.5" cy="9" r="1.2" fill="white" stroke="none" />
      
      {/* gill mark - curved line */}
      <path d="M 15 8 Q 17 9 15.5 11" stroke="white" strokeWidth="0.7" fill="none" />
      
      {/* top attachment loop */}
      <path d="M 11 7 Q 10.2 5.5 11.5 5 Q 12.5 5 12.5 6.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      
      {/* front treble hook */}
      <path d="M 8 14 L 6.5 16 Q 6 17 7 17.5 Q 8 18 8.5 17" stroke="currentColor" strokeWidth="1" fill="none" />
      
      {/* rear treble hook */}
      <path d="M 14 14 L 12.5 16 Q 12 17 13 17.5 Q 14 18 14.5 17" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}