import React from "react";

const LABELS = ["12am", "3", "6", "9", "12pm", "3", "6", "9pm"];

const buildSmoothPath = (points) => {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

export default function ActivityChart({ levels, highlightIndex }) {
  const maxLevel = Math.max(...levels, 1);
  const width = 100;
  const height = 100;
  const stepX = width / (levels.length - 1);

  const points = levels.map((level, i) => ({
    x: i * stepX,
    y: height - (level / maxLevel) * height,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  const highlightX = highlightIndex != null ? highlightIndex * stepX : null;

  const hourCount = 24;

  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-24">
        <defs>
          <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#activityGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {highlightX != null && (
          <circle
            cx={highlightX}
            cy={points[highlightIndex]?.y ?? height}
            r="2"
            fill="#f87171"
            stroke="white"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <div className="relative mt-1">
        <div className="flex">
          {Array.from({ length: hourCount }).map((_, i) => (
            <div key={i} className="flex-1 flex justify-center">
              <div className={`w-px ${i % 3 === 0 ? "h-2 bg-muted-foreground/50" : "h-1 bg-muted-foreground/30"}`} />
            </div>
          ))}
        </div>
        <div className="flex mt-1">
          {LABELS.map((label, i) => (
            <p key={i} className="flex-1 text-center text-xs text-muted-foreground">
              {label}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}