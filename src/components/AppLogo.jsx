import React from "react";

export const APP_LOGO_URL = "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/ad2c28b1b_GreenHeron.png";

export default function AppLogo({ className = "w-10 h-10" }) {
  return (
    <img
      src={APP_LOGO_URL}
      alt="Heron"
      className={`rounded-full object-cover shrink-0 ${className}`}
    />
  );
}