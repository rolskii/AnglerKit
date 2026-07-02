import React from "react";
import FishIcon from "@/components/FishIcon";

const TOTAL_HOURS = 19; // 5am to 12am

const LABELS = [
  { num: "6", period: "am", hour: 1 },
  { num: "9", period: "am", hour: 4 },
  { num: "12", period: "pm", hour: 7 },
  { num: "3", period: "pm", hour: 10 },
  { num: "6", period: "pm", hour: 13 },
  { num: "9", period: "pm", hour: 16 },
  { num: "12", period: "am", hour: 19 },
];

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

const findPeaks = (levels) => {
  const peaks = [];
  let i = 0;
  while (i < levels.length) {
    const prev = i > 0 ? levels[i - 1] : 0;
    const next = i < levels.length - 1 ? levels[i + 1] : 0;
    if (levels[i] >= prev && levels[i] >= next && levels[i] > 12) {
      let end = i;
      while (end < levels.length - 1 && levels[end + 1] === levels[i]) end++;
      peaks.push(Math.floor((i + end) / 2));
      i = end + 1;
    } else {
      i++;
    }
  }
  return peaks;
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

  const peaks = findPeaks(levels);

  const hourCount = TOTAL_HOURS;

  return (
    <div>
      <div className="relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-10">
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
      <div className="absolute inset-0 pointer-events-none">
        {peaks.map((peakIdx) => {
          const px = (peakIdx / (levels.length - 1)) * 100;
          const py = 100 - (levels[peakIdx] / maxLevel) * 100;
          return (
            <div
              key={peakIdx}
              className="absolute"
              style={{ left: `${px}%`, top: `${py}%`, transform: "translate(-50%, calc(-100% + 2px))" }}
            >
              <FishIcon className="w-6 h-6 text-primary" />
            </div>
          );
        })}
      </div>
      </div>
      <div className="relative mt-1">
        <div className="relative h-2">
          {Array.from({ length: hourCount + 1 }).map((_, i) => {
            const isLabeled = LABELS.some(l => l.hour === i);
            return (
              <div
                key={i}
                className={`w-px ${isLabeled ? "h-2 bg-muted-foreground" : "h-1.5 bg-muted-foreground/35"}`}
                style={{ position: "absolute", left: `${(i / hourCount) * 100}%`, transform: "translateX(-50%)" }}
              />
            );
          })}
        </div>
        <div className="relative mt-1 h-6">
          {LABELS.map((label, i) => {
            const isFirst = i === 0;
            const isLast = i === LABELS.length - 1;
            return (
            <div
              key={i}
              className="text-center text-xs text-muted-foreground leading-tight"
              style={{ position: "absolute", left: `${(label.hour / hourCount) * 100}%`, transform: isFirst ? "translateX(0%)" : isLast ? "translateX(-100%)" : "translateX(-50%)" }}
            >
              <div>{label.num}</div>
              <div className="text-[9px]">{label.num === "12" && label.period === "pm" ? label.period : ""}</div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}