import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* lure body - filled crankbait shape */}
      <path d="M 5 10 Q 5 7 9 6.5 L 19 6.5 Q 21 6.5 21 10 Q 21 13.5 19 14 L 9 14 Q 5 13.5 5 10 Z" fill="currentColor" />
      
      {/* eye - white circle */}
      <circle cx="19" cy="9" r="1.3" fill="white" />
      
      {/* gill mark - white curved line */}
      <path d="M 15.5 7.5 Q 18 9 16 11" stroke="white" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      
      {/* top attachment loop */}
      <path d="M 12 6.5 Q 11 4.8 12.5 4.5 Q 13.5 4.5 13.5 6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* front treble hook */}
      <path d="M 8.5 14 L 6.8 16.2 Q 6.2 17.2 7.3 17.8 Q 8.5 18.3 9 17.2" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* rear treble hook */}
      <path d="M 15 14 L 13.3 16.2 Q 12.7 17.2 13.8 17.8 Q 15 18.3 15.5 17.2" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}