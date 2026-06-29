import React from "react";

export default function ReelIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* reel foot / seat */}
      <rect x="8.5" y="4" width="7" height="2" rx="0.6" />
      {/* neck connecting foot to spool */}
      <rect x="11" y="5.6" width="2" height="2.4" />
      {/* spool with center + six ring holes cut out */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.5 14 A6.5 6.5 0 1 0 18.5 14 A6.5 6.5 0 1 0 5.5 14 Z
           M10.5 14 A1.5 1.5 0 1 1 13.5 14 A1.5 1.5 0 1 1 10.5 14 Z
           M14.75 14 A0.85 0.85 0 1 1 16.45 14 A0.85 0.85 0 1 1 14.75 14 Z
           M12.95 10.88 A0.85 0.85 0 1 1 14.65 10.88 A0.85 0.85 0 1 1 12.95 10.88 Z
           M9.35 10.88 A0.85 0.85 0 1 1 11.05 10.88 A0.85 0.85 0 1 1 9.35 10.88 Z
           M7.55 14 A0.85 0.85 0 1 1 9.25 14 A0.85 0.85 0 1 1 7.55 14 Z
           M9.35 17.12 A0.85 0.85 0 1 1 11.05 17.12 A0.85 0.85 0 1 1 9.35 17.12 Z
           M12.95 17.12 A0.85 0.85 0 1 1 14.65 17.12 A0.85 0.85 0 1 1 12.95 17.12 Z"
      />
    </svg>
  );
}