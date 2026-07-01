import React from "react";

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function LinesIcon({ className, ...props }) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M17 13.44 4.442 17.082A2 2 0 0 0 4.982 21H19a2 2 0 0 0 .558-3.921l-1.115-.32A2 2 0 0 1 17 14.837V7.66" />
      <path d="m7 10.56 12.558-3.642A2 2 0 0 0 19.018 3H5a2 2 0 0 0-.558 3.921l1.115.32A2 2 0 0 1 7 9.163v7.178" />
    </svg>
  );
}

export function RodIcon({ className, ...props }) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="M4 11h1" />
      <path d="M8 15a2 2 0 0 1-4 0V3a1 1 0 0 1 1-1h.5C14 2 20 9 20 18v4" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

export function ReelIcon({ className, ...props }) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <line x1="7.5" y1="6" x2="16.5" y2="6" />
      <circle cx="12" cy="14" r="7" />
      <circle cx="12" cy="14" r="2.5" />
    </svg>
  );
}

export function LureIcon({ className, ...props }) {
  return (
    <svg {...baseProps} className={className} {...props}>
      <path d="m17.586 11.414-5.93 5.93a1 1 0 0 1-8-8l3.137-3.137a.707.707 0 0 1 1.207.5V10" />
      <path d="M20.414 8.586 22 7" />
      <circle cx="19" cy="10" r="2" />
    </svg>
  );
}