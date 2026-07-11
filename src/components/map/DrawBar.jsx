import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const COLORS = [
  '#ef4444', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ffffff', // white
  '#000000', // black
];

export default function DrawBar({ onClear, strokeCount, color, onColorChange }) {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] flex flex-col items-center gap-2 px-3 py-2 rounded-2xl bg-red-500/95 text-white shadow-lg backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Pencil className="w-4 h-4" />
        <span>Drawing{strokeCount > 0 ? ` · ${strokeCount}` : ''}</span>
        {strokeCount > 0 && (
          <button onClick={onClear} className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-white/40'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}