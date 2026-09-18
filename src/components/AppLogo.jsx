import React from "react";

export const APP_LOGO_URL = "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/569bf3a60_GrHeronRound.png";

export default function AppLogo({ className = "w-10 h-10" }) {
  return (
    <img
      src={APP_LOGO_URL}
      alt="HeronWise"
      className={`rounded-full object-cover shrink-0 dark:invert ${className}`}
    />
  );
}