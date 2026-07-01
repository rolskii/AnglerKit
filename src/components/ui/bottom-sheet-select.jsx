import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, Check } from "lucide-react";

export default function BottomSheetSelect({ value, onChange, options, placeholder, label, className }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const baseClass = "flex h-9 w-full items-center justify-between rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

  if (!isMobile) {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={className || baseClass}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  const selected = options.find((o) => o.value === value);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button type="button" className={className || baseClass}>
          <span className={selected ? "" : "text-muted-foreground"}>{selected ? selected.label : (placeholder || "Select...")}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>{label || "Select an option"}</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[50vh] overflow-y-auto pb-4">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-accent transition-colors ${opt.value === value ? "text-primary font-medium" : ""}`}
            >
              {opt.label}
              {opt.value === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}