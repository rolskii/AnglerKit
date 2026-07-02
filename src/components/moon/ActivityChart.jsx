import React from "react";

const LABELS = ["12am", "3", "6", "9", "12pm", "3", "6", "9pm"];

export default function ActivityChart({ levels, highlightIndex }) {
  const maxLevel = Math.max(...levels, 1);
  return (
    <div>
      <div className="flex items-end justify-between gap-1 h-24">
        {levels.map((level, i) => {
          const height = (level / maxLevel) * 100;
          const isHighlight = i === highlightIndex;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className={`w-full max-w-[24px] rounded-t-md transition-all ${
                  isHighlight ? "bg-red-400" : "bg-primary"
                }`}
                style={{ height: `${Math.max(height, 6)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        {LABELS.map((label, i) => (
          <p key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}