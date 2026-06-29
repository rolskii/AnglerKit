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
      {/* main lure body - wide rounded crankbait shape */}
      <path d="M 3.5 11 Q 3.5 8 8 7 L 18 7 Q 21 7 21.5 11 Q 21.5 15 18 16 L 8 16 Q 3.5 14 3.5 11 Z" fill="currentColor" />
      
      {/* eye - white circle */}
      <circle cx="19.5" cy="9.5" r="1.2" fill="white" />
      
      {/* gill line - white curved stroke */}
      <path d="M 15.5 8 Q 18.5 10.5 15.5 13" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" />
      
      {/* top knot loop */}
      <path d="M 11 7 Q 10 5 11.5 4.5 Q 13 4.5 12.5 6.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* front treble hook - hook shape */}
      <path d="M 6 16 L 4.5 17.8 Q 3.8 18.5 4.8 19 Q 6 19.5 6.8 18.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* rear treble hook */}
      <path d="M 13 16 L 11.5 17.8 Q 10.8 18.5 11.8 19 Q 13 19.5 13.8 18.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}