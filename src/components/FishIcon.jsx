import React from "react";
import { FISH_GLYPH_PATH } from "@/components/icons/fish-glyph";

export default function FishIcon({ className = "", ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...props}>
      <path d={FISH_GLYPH_PATH} />
    </svg>
  );
}
