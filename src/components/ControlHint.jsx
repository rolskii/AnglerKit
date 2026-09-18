import React from 'react';

/**
 * Persistent label for an icon-only control.
 * Rendered beside the control whenever the "Help Labels" setting is on.
 */
export default function ControlHint({ show, text, className = '' }) {
  if (!show) return null;
  return (
    <span
      className={`absolute whitespace-nowrap pointer-events-none z-[600] rounded-md bg-foreground/90 text-background text-[10px] font-medium tracking-wide px-2 py-0.5 shadow-sm backdrop-blur-sm ${className}`}
    >
      {text}
    </span>
  );
}