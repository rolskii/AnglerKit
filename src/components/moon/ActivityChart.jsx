import React from "react";

const LABELS = ["12am", "3", "6", "9", "12pm", "3", "6", "9pm"];

export default function ActivityChart({ levels, highlightIndex }) {
  const maxLevel = Math.max(...levels, 1);
  return (
    <div>
      <div className="flex items-end gap-[2px] h-24">
        {levels.map((level, i) => {
          const height = (level / maxLevel) * 100;
          const isHighlight = i === highlightIndex;
          const opacity = isHighlight ? 1 : 0.85;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full min-w-0">
              <div
                className={`w-full rounded-full transition-all duration-200 ${
                  isHighlight ? "bg-red-400" : "bg-primary"
                }`}
                style={{ height: `${Math.max(height, 4)}%`, opacity }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex mt-1.5">
        {LABELS.map((label, i) => (
          <p key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}