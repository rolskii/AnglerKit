import React from "react";

export default function FishingNetIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* handle - angled pole */}
      <path d="M 18 2 L 8 13" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      
      {/* hoop - oval/circle */}
      <ellipse cx="6.5" cy="7" rx="3.5" ry="3.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* connection point - where handle meets hoop */}
      <circle cx="8" cy="11" r="0.6" fill="currentColor" />
      
      {/* net pouch - trapezoid shape */}
      <path d="M 3.5 11 L 2.5 18 Q 6.5 21 10.5 18 L 9.5 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      
      {/* net mesh - vertical lines */}
      <line x1="4" y1="11" x2="3.2" y2="18" stroke="currentColor" strokeWidth="0.9" />
      <line x1="6.5" y1="11" x2="6.5" y2="20" stroke="currentColor" strokeWidth="0.9" />
      <line x1="9" y1="11" x2="9.8" y2="18" stroke="currentColor" strokeWidth="0.9" />
      
      {/* net mesh - horizontal lines */}
      <line x1="3.3" y1="13" x2="9.7" y2="13" stroke="currentColor" strokeWidth="0.9" />
      <line x1="3" y1="15" x2="10" y2="15" stroke="currentColor" strokeWidth="0.9" />
      <line x1="2.8" y1="17" x2="10.2" y2="17" stroke="currentColor" strokeWidth="0.9" />
    </svg>
  );
}