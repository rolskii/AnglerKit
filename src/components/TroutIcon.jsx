import React from "react";

export default function TroutIcon({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* main body - classic trout profile, facing left */}
      <path
        d="M2 34
           C 8 24, 16 21, 24 21
           C 30 21, 35 22, 40 24
           L 50 16
           C 49 20, 48 23, 49 27
           L 60 22
           C 58 27, 58 31, 60 36
           L 49 41
           C 48 45, 49 48, 50 52
           L 40 44
           C 35 46, 30 47, 24 47
           C 16 47, 8 44, 2 34 Z"
        fill="currentColor"
      />
      {/* dorsal fin */}
      <path
        d="M22 21
           C 24 14, 28 10, 33 9
           C 32 13, 32 17, 33 21 Z"
        fill="currentColor"
      />
      {/* adipose fin */}
      <path
        d="M40 44
           C 42 48, 44 49, 47 49
           C 45 47, 44 45, 44 43 Z"
        fill="currentColor"
      />
      {/* pectoral fin */}
      <path
        d="M18 38
           C 14 42, 9 44, 5 45
           C 8 42, 9 39, 9 36
           C 12 38, 15 38, 18 38 Z"
        fill="currentColor"
      />
      {/* anal fin */}
      <path
        d="M38 47
           C 40 51, 42 52, 45 52
           C 43 50, 42 48, 42 46 Z"
        fill="currentColor"
      />
      {/* gill curve */}
      <path
        d="M14 23
           C 11 28, 11 40, 14 45"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* eye */}
      <circle cx="9" cy="31" r="2.4" fill="rgba(0,0,0,0.35)" />
      <circle cx="9.6" cy="30.4" r="0.9" fill="#fff" />
      {/* spots along lateral line */}
      <circle cx="22" cy="30" r="1.4" fill="rgba(0,0,0,0.3)" />
      <circle cx="29" cy="33" r="1.4" fill="rgba(0,0,0,0.3)" />
      <circle cx="36" cy="30" r="1.4" fill="rgba(0,0,0,0.3)" />
      <circle cx="26" cy="37" r="1.4" fill="rgba(0,0,0,0.3)" />
      <circle cx="33" cy="38" r="1.4" fill="rgba(0,0,0,0.3)" />
      <circle cx="40" cy="35" r="1.4" fill="rgba(0,0,0,0.3)" />
    </svg>
  );
}