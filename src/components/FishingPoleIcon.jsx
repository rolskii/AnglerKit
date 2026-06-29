import React from "react";

export default function FishingPoleIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 20.5C7 17 13 11 19.5 4.5" />
      <path d="M19.5 4.5v6.5" />
      <path d="M19.5 11c0 2.2-1.6 4-3.8 4-1.7 0-3-1.3-3-3" />
      <circle cx="8.5" cy="15.5" r="1.2" />
    </svg>
  );
}