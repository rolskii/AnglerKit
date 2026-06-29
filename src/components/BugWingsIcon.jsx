import React from "react";

export default function BugWingsIcon({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Left wings */}
      <path d="M11 8 C 6 4, 2 5, 2 9 C 2 12, 6 12, 11 10" />
      {/* Right wings */}
      <path d="M13 8 C 18 4, 22 5, 22 9 C 22 12, 18 12, 13 10" />
      {/* Antennae */}
      <line x1="10" y1="5" x2="8" y2="2" />
      <line x1="14" y1="5" x2="16" y2="2" />
      {/* Body */}
      <ellipse cx="12" cy="13" rx="2.5" ry="6" />
      {/* Body segments */}
      <line x1="10.5" y1="12" x2="13.5" y2="12" />
      <line x1="10.5" y1="15" x2="13.5" y2="15" />
      {/* Legs */}
      <line x1="9.5" y1="11" x2="6" y2="11" />
      <line x1="9.5" y1="14" x2="6" y2="15" />
      <line x1="9.5" y1="17" x2="6" y2="19" />
      <line x1="14.5" y1="11" x2="18" y2="11" />
      <line x1="14.5" y1="14" x2="18" y2="15" />
      <line x1="14.5" y1="17" x2="18" y2="19" />
    </svg>
  );
}