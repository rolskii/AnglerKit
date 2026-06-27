import React from "react";

export default function FlyLineIcon({ className = "" }) {
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
      {/* Spool outer rim (side view) */}
      <ellipse cx="12" cy="12" rx="8.5" ry="3.2" />
      {/* Spool inner core */}
      <ellipse cx="12" cy="12" rx="2.4" ry="1" />
      {/* Line wound around the spool */}
      <ellipse cx="12" cy="11" rx="6.5" ry="2.4" />
      <ellipse cx="12" cy="13" rx="6.5" ry="2.4" />
      {/* Line coming off the spool */}
      <path d="M20.5 12.5 C 22 13, 22 15, 20 15.5" />
      <path d="M20 15.5 C 18 16, 16.5 17, 15 18.5" />
      {/* Center axle hole */}
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}