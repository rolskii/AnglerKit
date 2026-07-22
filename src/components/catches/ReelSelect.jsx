import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const COLUMNS = [
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "type", label: "Type" },
  { key: "size", label: "Size" },
  { key: "condition", label: "Condition" },
];

const cell = (r, key) => (r[key] == null ? "" : String(r[key]));

export default function ReelSelect({ reels, value, onChange }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open || isMobile) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, isMobile]);

  const selected = reels.find((r) => r.id === value) || null;
  const selectedLabel = selected ? selected.name : "";
  const placeholder = reels.length ? "Select a reel (optional)" : "No reels added yet";

  const triggerBtn = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    >
      <span className={selected ? "text-foreground" : "text-muted-foreground"}>
        {selected ? selectedLabel : placeholder}
      </span>
      <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
    </button>
  );

  const tableContent = (
    <>
      <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
        {COLUMNS.map((c) => (
          <div key={c.key} className="truncate">{c.label}</div>
        ))}
      </div>
      <div className="max-h-64 overflow-y-auto">
        <button
          type="button"
          onClick={() => { onChange(""); setOpen(false); }}
          className="grid w-full grid-cols-5 gap-2 px-3 py-2 text-sm text-left hover:bg-accent/50"
        >
          <div className="col-span-5 text-muted-foreground">—</div>
        </button>
        {reels.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">No reels available</div>
        )}
        {reels.map((r) => (
          <button
            type="button"
            key={r.id}
            onClick={() => { onChange(r.id); setOpen(false); }}
            className={`grid w-full grid-cols-5 gap-2 px-3 py-2 text-sm text-left border-t border-border/60 hover:bg-accent/50 ${r.id === value ? "bg-accent/30" : ""}`}
          >
            {COLUMNS.map((c) => (
              <div key={c.key} className="truncate flex items-center">
                {c.key === "brand" && r.id === value && <Check className="w-3.5 h-3.5 mr-1 text-primary shrink-0" />}
                <span className="truncate">{cell(r, c.key)}</span>
              </div>
            ))}
          </button>
        ))}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        {triggerBtn}
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Select a reel</DrawerTitle>
            <DrawerDescription>Choose a reel for this catch</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-1 pb-6">
            {tableContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {triggerBtn}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[34rem] rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          {tableContent}
        </div>
      )}
    </div>
  );
}