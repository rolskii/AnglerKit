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
      {/* lure body */}
      <ellipse cx="12" cy="10" rx="8" ry="5" fill="currentColor" />
      
      {/* eye */}
      <circle cx="19" cy="8.5" r="1.2" fill="white" />
      
      {/* gill mark curve */}
      <path d="M16 7 Q18 9 16.5 11" stroke="white" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      
      {/* top loop/knot point */}
      <path d="M12 4.5 Q10.5 3.5 11.5 2.5 Q12.5 2 13 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* front treble hook */}
      <path d="M8 14.5 L7 16 Q7 17 8 17.5 Q9 18 9 17" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* rear treble hook */}
      <path d="M14 14.5 L13 16 Q13 17 14 17.5 Q15 18 15 17" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}