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
      <div className={`shrink-0 ${colorClass}`}>
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
      </div>
      <p className={`text-sm font-bold tracking-wide leading-tight ${colorClass}`}>
        {ratingLabel}
      </p>
    </div>
  );
}