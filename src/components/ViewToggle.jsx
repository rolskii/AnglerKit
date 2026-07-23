import React from "react";
import { List, LayoutGrid } from "lucide-react";

export default function ViewToggle({ viewMode, setViewMode }) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
      <button
        onClick={() => setViewMode("list")}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">List</span>
      </button>
      <button
        onClick={() => setViewMode("thumbnail")}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "thumbnail" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Thumbnails</span>
      </button>
    </div>
  );
}