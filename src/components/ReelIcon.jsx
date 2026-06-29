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
      <rect x="7.5" y="2.5" width="9" height="2" rx="0.7" />
      {/* neck connecting foot to spool */}
      <rect x="11" y="4" width="2" height="1.6" />
      {/* spool with center + six ring holes cut out */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 13 A8 8 0 1 0 20 13 A8 8 0 1 0 4 13 Z
           M10.2 13 A1.8 1.8 0 1 1 13.8 13 A1.8 1.8 0 1 1 10.2 13 Z
           M15.5 13 A1 1 0 1 1 17.5 13 A1 1 0 1 1 15.5 13 Z
           M13.25 9.1 A1 1 0 1 1 15.25 9.1 A1 1 0 1 1 13.25 9.1 Z
           M8.75 9.1 A1 1 0 1 1 10.75 9.1 A1 1 0 1 1 8.75 9.1 Z
           M6.5 13 A1 1 0 1 1 8.5 13 A1 1 0 1 1 6.5 13 Z
           M8.75 16.9 A1 1 0 1 1 10.75 16.9 A1 1 0 1 1 8.75 16.9 Z
           M13.25 16.9 A1 1 0 1 1 15.25 16.9 A1 1 0 1 1 13.25 16.9 Z"
      />
    </svg>
  );
}