import React from "react";

export default function ReelIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Reel body */}
      <circle cx="12" cy="12" r="8.5" />
      {/* Spool center */}
      <circle cx="12" cy="12" r="2.2" />
      {/* Spoke holes around the spool */}
      <circle cx="12" cy="6.5" r="0.9" />
      <circle cx="16.9" cy="9.3" r="0.9" />
      <circle cx="16.9" cy="14.7" r="0.9" />
      <circle cx="12" cy="17.5" r="0.9" />
      <circle cx="7.1" cy="14.7" r="0.9" />
      <circle cx="7.1" cy="9.3" r="0.9" />
      {/* Handle */}
      <line x1="12" y1="12" x2="18.5" y2="5.5" />
      <circle cx="19.2" cy="4.8" r="1.1" />
      {/* Mounting foot */}
      <line x1="3.5" y1="20.5" x2="8" y2="20.5" />
    </svg>
  );
}