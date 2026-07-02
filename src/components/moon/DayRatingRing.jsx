import React from "react";

export default function DayRatingRing({ percentage, rating, ratingLabel }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const colorClass = rating >= 5 ? "text-green-600" : rating <= 3 ? "text-yellow-600" : "text-primary";

  return (
    <div className="flex items-center gap-3">
      <p className="text-base font-semibold text-card-foreground leading-none tracking-tight whitespace-nowrap">
        Fish Bite Rating:
      </p>
      <p className={`text-base font-semibold leading-none tracking-tight ${colorClass} whitespace-nowrap`}>
        {ratingLabel}
      </p>
    </div>
  );
}