import React from "react";

const TROUT_IMG_URL =
  "https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/552bbaffa_PermitWt.png";

export default function TroutIcon({ className = "w-7 h-7" }) {
  return (
    <img
      src={TROUT_IMG_URL}
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
      style={{ mixBlendMode: "screen", transform: "scaleX(-1)" }}
    />
  );
}