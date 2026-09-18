import React from 'react';

/**
 * Temporary onboarding label for an icon-only control.
 * Rendered beside the control while hints are active (first 7 seconds a
 * screen is open and the "Help Labels" setting is on), then it disappears.
 */
export default function ControlHint({ show, text, className = '' }) {
  if (!show) return null;
  return (
    <span
      className={`absolute whitespace-nowrap pointer-events-none z-[600] rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 shadow-lg ${className}`}
    >
      {text}
    </span>
  );
}