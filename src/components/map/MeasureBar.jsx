import React from 'react';
import { Ruler, Undo2, Trash2, Save } from 'lucide-react';

export default function MeasureBar({ totalKm, pointCount, onUndo, onClear, onSave }) {
  return (
    <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-4 py-2 rounded-full bg-yellow-500 text-white text-sm font-medium shadow-lg">
      <Ruler className="w-4 h-4" />
      <span>{totalKm.toFixed(2)} km</span>
      <span className="text-xs opacity-80">({pointCount} pts)</span>
      <button onClick={onUndo} className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors" title="Undo last point">
        <Undo2 className="w-4 h-4" />
      </button>
      <button onClick={onSave} disabled={pointCount < 2} className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-40" title="Save measurement">
        <Save className="w-4 h-4" />
      </button>
      <button onClick={onClear} className="p-1 rounded-full hover:bg-white/20 transition-colors" title="Clear">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}