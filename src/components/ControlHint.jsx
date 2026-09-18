import React from 'react';

/**
 * Persistent label for an icon-only control.
 * Rendered beside the control whenever the "Help Labels" setting is on.
 */
export default function ControlHint({ show, text, className = '' }) {
  if (!show) return null;
  return (
    <span
      className={`absolute whitespace-nowrap pointer-events-none z-[600] italic text-[10px] font-medium text-muted-foreground ${className}`}
    >
      {text}
    </span>
  );
}