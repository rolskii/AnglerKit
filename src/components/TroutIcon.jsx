import React from "react";
import { FISH_GLYPH_PATH } from "@/components/icons/fish-glyph";

export default function TroutIcon({ className = "w-7 h-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={FISH_GLYPH_PATH} />
    </svg>
  );
}
