import React from 'react';
import { Radio } from 'lucide-react';
import ControlHint from '@/components/ControlHint';
import { useControlHints } from '@/lib/controlLabels';

/**
 * Forest-green circular access button with a coral status dot when audio is active.
 */
export default function RadioAccessButton({ active, onClick, className = '' }) {
  const showHints = useControlHints();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open radio"
      className={`relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90 ${className}`}
      style={{ backgroundColor: 'hsl(var(--primary))' }}
    >
      <Radio className="w-[18px] h-[18px] text-primary-foreground" strokeWidth={2.2} />
      {active && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background"
          style={{ backgroundColor: '#FF7D7D' }}
        />
      )}
      <ControlHint show={showHints} text="Radio" className="right-full mr-2 top-1/2 -translate-y-1/2" />
    </button>
  );
}