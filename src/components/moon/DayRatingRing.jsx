import React from "react";

export default function DayRatingRing({ percentage, rating, ratingLabel }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, percentage ?? 0));
  const offset = circumference - (pct / 100) * circumference;
  const colorClass = rating >= 5 ? "text-green-600" : rating <= 3 ? "text-yellow-600" : "text-primary";
  const strokeColor = rating >= 5 ? "#16a34a" : rating <= 3 ? "#ca8a04" : "hsl(var(--primary))";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32 shrink-0">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-card-foreground leading-none">{Math.round(pct)}%</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-card-foreground leading-none tracking-tight whitespace-nowrap">
          Fish Bite Rating:
        </p>
        <p className={`text-sm font-semibold leading-none tracking-tight ${colorClass} whitespace-nowrap`}>
          {ratingLabel}
        </p>
      </div>
    </div>
  );
}