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
      {/* main lure body - fat rounded shape */}
      <ellipse cx="11" cy="9.5" rx="7.5" ry="4.5" fill="currentColor" />
      
      {/* head/nose taper */}
      <path d="M 18.5 9.5 Q 21 8.5 21.5 9.5 Q 21 10.5 18.5 10.5" fill="currentColor" />
      
      {/* white eye */}
      <circle cx="20.5" cy="8.5" r="1" fill="white" />
      
      {/* white gill mark curve */}
      <path d="M 16 7 Q 19 9.5 16.5 12" stroke="white" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      
      {/* top knot loop */}
      <path d="M 11 5 L 11.5 3 L 12 5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* left front hook */}
      <path d="M 6 13.5 L 4.5 15.5 Q 4 16.5 5 17 Q 6 17.3 6.2 16.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* right rear hook */}
      <path d="M 14 13.5 L 12.5 15.5 Q 12 16.5 13 17 Q 14 17.3 14.2 16.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}