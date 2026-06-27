import React from "react";

export default function TroutIcon({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* elongated trout body */}
      <path d="M6 32c6-9 16-13 26-13 7 0 12 2 18 6 3 2 3 10 0 12-6 4-11 6-18 6-10 0-20-4-26-11z" />
      {/* forked tail */}
      <path d="M50 25l8-6M50 39l8 6M50 32h10" />
      {/* dorsal fin */}
      <path d="M22 19c2-4 5-6 8-6M30 19c1-3 3-5 5-6" />
      {/* adipose fin (small) */}
      <path d="M40 19c2-2 4-3 6-3" />
      {/* pectoral fin */}
      <path d="M24 36c-2 4-5 6-9 7" />
      {/* gill curve */}
      <path d="M20 24c-2 3-2 11 0 14" />
      {/* eye */}
      <circle cx="14" cy="30" r="1.6" fill="currentColor" stroke="none" />
      {/* spots along body */}
      <circle cx="28" cy="28" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="36" cy="31" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="32" cy="35" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="42" cy="29" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}