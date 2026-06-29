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
      <rect x="7" y="2.5" width="10" height="2" rx="0.7" />
      {/* neck connecting foot to spool */}
      <rect x="11" y="4" width="2" height="1.2" />
      {/* spool with center + six ring holes cut out */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 13.5 A9 9 0 1 0 21 13.5 A9 9 0 1 0 3 13.5 Z
           M10 13.5 A2 2 0 1 1 14 13.5 A2 2 0 1 1 10 13.5 Z
           M15.9 13.5 A1.1 1.1 0 1 1 18.1 13.5 A1.1 1.1 0 1 1 15.9 13.5 Z
           M13.4 9.17 A1.1 1.1 0 1 1 15.6 9.17 A1.1 1.1 0 1 1 13.4 9.17 Z
           M8.4 9.17 A1.1 1.1 0 1 1 10.6 9.17 A1.1 1.1 0 1 1 8.4 9.17 Z
           M5.9 13.5 A1.1 1.1 0 1 1 8.1 13.5 A1.1 1.1 0 1 1 5.9 13.5 Z
           M8.4 17.83 A1.1 1.1 0 1 1 10.6 17.83 A1.1 1.1 0 1 1 8.4 17.83 Z
           M13.4 17.83 A1.1 1.1 0 1 1 15.6 17.83 A1.1 1.1 0 1 1 13.4 17.83 Z"
      />
    </svg>
  );
}