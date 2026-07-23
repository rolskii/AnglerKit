import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

/**
 * Formats an ISO date string (e.g. "2026-07-22") as "Jul.22/26".
 * Returns "" for falsy/invalid input.
 */
export function formatGearDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
  const day = d.getDate();
  const yr = String(d.getFullYear()).slice(-2);
  return `${months[d.getMonth()]}${day}/${yr}`;
}