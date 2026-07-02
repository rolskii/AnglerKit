import React from "react";

export default function DayRatingRing({ percentage, rating, ratingLabel }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const colorClass = rating >= 5 ? "text-green-600" : rating <= 3 ? "text-yellow-600" : "text-primary";

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-bold text-muted-foreground tracking-widest leading-tight text-right">
        FISH BITE<br/>RATING
      </p>
      <div className={`relative w-28 h-28 shrink-0 ${colorClass}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-foreground">
          <span className="text-3xl font-bold">{percentage}%</span>
        </div>
      </div>
      <p className={`text-sm font-bold tracking-wide leading-tight ${colorClass}`}>
        {ratingLabel}
      </p>
    </div>
  );
}