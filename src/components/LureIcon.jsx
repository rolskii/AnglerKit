import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <img
        src="https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/24434a246_Screenshot2026-06-28223854.png"
        alt="Lure icon"
        className="w-7 h-7 text-primary"
        {...props}
      />
    </div>
  );
}