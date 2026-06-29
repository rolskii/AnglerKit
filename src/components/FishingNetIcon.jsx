import React from "react";

export default function FishingNetIcon({ className, ...props }) {
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
      {/* handle - thick angled line */}
      <line x1="20" y1="3" x2="9" y2="15" strokeWidth="2" />
      
      {/* hoop - oval */}
      <ellipse cx="6" cy="8" rx="3.2" ry="3.5" />
      
      {/* connection point */}
      <circle cx="8.5" cy="11.5" r="0.4" fill="currentColor" />
      
      {/* net shape - trapezoid */}
      <path d="M 3.2 11.5 L 2 19 Q 6 21.5 10 19 L 8.8 11.5 Z" />
      
      {/* vertical mesh lines */}
      <line x1="4" y1="11.5" x2="3" y2="19" />
      <line x1="6" y1="11.5" x2="6" y2="20.5" />
      <line x1="8" y1="11.5" x2="9" y2="19" />
      
      {/* horizontal mesh lines */}
      <line x1="3.2" y1="13.5" x2="8.8" y2="13.5" />
      <line x1="2.8" y1="15.5" x2="9.2" y2="15.5" />
      <line x1="2.5" y1="17.5" x2="9.5" y2="17.5" />
    </svg>
  );
}