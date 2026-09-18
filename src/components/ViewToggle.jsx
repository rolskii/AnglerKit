import React from "react";
import { List, LayoutGrid } from "lucide-react";
import ControlHint from "@/components/ControlHint";
import { useControlHints } from "@/lib/controlLabels";

export default function ViewToggle({ viewMode, setViewMode }) {
  const showHints = useControlHints();
  return (
    <div className="relative w-fit shrink-0">
      <ControlHint show={showHints} text="List view" className="left-full ml-2 top-1/2 -translate-y-1/2 sm:ml-0 sm:left-0 sm:top-auto sm:bottom-full sm:mb-1.5 sm:translate-y-0" />
      <ControlHint show={showHints} text="Thumbnails" className="left-full ml-[5.5rem] top-1/2 -translate-y-1/2 sm:ml-0 sm:left-auto sm:right-0 sm:top-auto sm:bottom-full sm:mb-1.5 sm:translate-y-0" />
      <div className="flex w-fit rounded-lg border border-border overflow-hidden">
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
    </div>
  );
}