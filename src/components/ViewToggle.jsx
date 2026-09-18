import React from "react";
import { List, LayoutGrid } from "lucide-react";
import ControlHint from "@/components/ControlHint";
import { useControlHints } from "@/lib/controlLabels";

export default function ViewToggle({ viewMode, setViewMode }) {
  const showHints = useControlHints();
  return (
    <div className="relative w-fit shrink-0">
      <ControlHint show={showHints} text="List view" className="bottom-full mb-1.5 left-0" />
      <ControlHint show={showHints} text="Thumbnails" className="top-full mt-1.5 right-0" />
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