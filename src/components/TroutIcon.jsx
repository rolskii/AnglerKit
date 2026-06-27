import React from "react";

export default function TroutIcon({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* trout body silhouette */}
      <path
        d="M4 33c7-10 18-15 30-15 6 0 11 1.5 16 4.5l9-5.5-4 9 4 9-9-5.5c-5 3-10 4.5-16 4.5-12 0-23-5-30-15z"
        fill="currentColor"
      />
      {/* gill line */}
      <path
        d="M20 20.5c-2.5 4-2.5 19 0 23"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
      {/* dorsal fin */}
      <path
        d="M24 18.5c2-4 5-6.5 9-7.5-1 4-1 7 0 9-3-1-6-1-9-1.5z"
        fill="currentColor"
      />
      {/* adipose fin */}
      <path
        d="M44 18c2-1.5 4-2 6-2-0.5 2-0.5 3.5 0 5-2-1.5-4-2.5-6-3z"
        fill="currentColor"
      />
      {/* pectoral fin */}
      <path
        d="M22 38c-2 4-6 7-11 8 2-4 2-7 1-9 3 1 7 1 10 1z"
        fill="currentColor"
      />
      {/* eye */}
      <circle cx="13" cy="30" r="2.2" fill="rgba(0,0,0,0.3)" />
      <circle cx="13.5" cy="29.5" r="0.8" fill="#fff" />
      {/* spots */}
      <circle cx="28" cy="27" r="1.3" fill="rgba(0,0,0,0.3)" />
      <circle cx="35" cy="30" r="1.3" fill="rgba(0,0,0,0.3)" />
      <circle cx="31" cy="34" r="1.3" fill="rgba(0,0,0,0.3)" />
      <circle cx="41" cy="27" r="1.3" fill="rgba(0,0,0,0.3)" />
      <circle cx="38" cy="34" r="1.3" fill="rgba(0,0,0,0.3)" />
    </svg>
  );
}