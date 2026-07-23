import React from "react";
import BottomSheetSelect from "@/components/ui/bottom-sheet-select";
import { ArrowUp, ArrowDown } from "lucide-react";

export default function MobileSortControl({ sortBy, sortDir, onSortField, onToggleDir, fields }) {
  return (
    <div className="md:hidden flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <BottomSheetSelect
          value={sortBy}
          onChange={onSortField}
          options={fields}
          label="Sort by"
          placeholder="Sort by..."
        />
      </div>
      <button
        type="button"
        onClick={onToggleDir}
        className="flex h-9 items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm shadow-sm whitespace-nowrap"
      >
        {sortDir === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        <span className="text-xs">{sortDir === "asc" ? "Asc" : "Desc"}</span>
      </button>
    </div>
  );
}