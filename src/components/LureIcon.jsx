import React from "react";

export default function LureIcon({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* main body - tapered from fat back to pointed nose */}
      <path d="M 4 11 Q 4 8.5 8 7.5 Q 14 6.5 20 9.5 Q 21.5 10 21.5 11 Q 21.5 12 20 12.5 Q 14 15.5 8 14.5 Q 4 13.5 4 11 Z" fill="currentColor" />
      
      {/* white eye */}
      <circle cx="19.5" cy="10" r="1.1" fill="white" />
      
      {/* white gill mark */}
      <path d="M 16 8.5 Q 19 10.5 16.5 12.5" stroke="white" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      
      {/* top attachment loop */}
      <path d="M 9 7.5 Q 7.5 5.8 8.5 4.8 Q 9.5 4.5 10 6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* front treble hook */}
      <path d="M 6 14.5 L 4.2 16.8 Q 3.5 17.8 4.8 18.3 Q 6 18.7 6.5 17.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* rear treble hook */}
      <path d="M 12.5 14.5 L 10.7 16.8 Q 10 17.8 11.3 18.3 Q 12.5 18.7 13 17.5" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}