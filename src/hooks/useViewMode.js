import { useState, useEffect } from "react";

const STORAGE_KEY = "gearViewMode";

export function useViewMode() {
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "list";
    } catch {
      return "list";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch {}
  }, [viewMode]);

  return [viewMode, setViewMode];
}