import React from 'react';
import { Radio } from 'lucide-react';

/**
 * Forest-green circular access button with a coral status dot when audio is active.
 */
export default function RadioAccessButton({ active, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open radio"
      className={`relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90 ${className}`}
      style={{ backgroundColor: '#006b53' }}
    >
      <Radio className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
      {active && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background"
          style={{ backgroundColor: '#FF7D7D' }}
        />
      )}
    </button>
  );
}