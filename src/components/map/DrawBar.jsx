import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function DrawBar({ onClear, strokeCount }) {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium shadow-lg">
      <Pencil className="w-4 h-4" />
      <span>Drawing mode{strokeCount > 0 ? ` · ${strokeCount} stroke${strokeCount > 1 ? 's' : ''}` : ''}</span>
      {strokeCount > 0 && (
        <button onClick={onClear} className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}