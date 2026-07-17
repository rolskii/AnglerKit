import React from "react";

const APP_LOGO_URL = "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/3f39c9959_Untitled-July162026at224101.png";

export default function AppLogo({ className = "w-10 h-10" }) {
  return (
    <img
      src={APP_LOGO_URL}
      alt="AnglerKit"
      className={`rounded-full object-cover shrink-0 ${className}`}
    />
  );
}