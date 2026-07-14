import React from 'react';
import { Undo2, Trash2, Save, Hexagon } from 'lucide-react';

export default function AreaBar({ areaLabel, pointCount, onUndo, onClear, onSave }) {
  return (
    <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-3 px-4 py-2 rounded-2xl bg-background/90 backdrop-blur-xl border border-border shadow-lg">
      <Hexagon className="w-5 h-5 text-emerald-500" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground leading-tight">Area</span>
        <span className="text-sm font-bold leading-tight">{areaLabel}</span>
      </div>
      <span className="text-xs text-muted-foreground">{pointCount} pts</span>
      <div className="flex items-center gap-1">
        <button onClick={onUndo} className="p-2 rounded-lg hover:bg-accent/10" title="Undo last point">
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onSave}
          disabled={pointCount < 3}
          className="p-2 rounded-lg hover:bg-accent/10 text-emerald-600 disabled:opacity-30"
          title="Save area"
        >
          <Save className="w-4 h-4" />
        </button>
        <button onClick={onClear} className="p-2 rounded-lg hover:bg-accent/10 text-destructive" title="Clear">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}