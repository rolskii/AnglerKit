import React from "react";

// Stylized Ontario trillium — the floral emblem of Ontario, used as the
// government symbol. Three petals arranged 120° apart around the centre.
const PETAL = "M12,12.5 C8.5,10.5 7,6.5 12,2.5 C17,6.5 15.5,10.5 12,12.5 Z";

export default function OntarioTrilliumIcon({ className = "", style, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden="true" {...props}>
      <path d={PETAL} />
      <path d={PETAL} transform="rotate(120 12 12)" />
      <path d={PETAL} transform="rotate(240 12 12)" />
    </svg>
  );
}