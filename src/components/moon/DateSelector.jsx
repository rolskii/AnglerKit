import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const toStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function DateSelector({ selectedDate, onSelectDate }) {
  const base = new Date(selectedDate + "T00:00:00");
  const dates = [];
  for (let i = -2; i <= 2; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }

  const shift = (dir) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dir);
    onSelectDate(toStr(d));
  };

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => shift(-1)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 flex justify-between gap-1">
        {dates.map((d) => {
          const str = toStr(d);
          const isSelected = str === selectedDate;
          return (
            <button
              key={str}
              onClick={() => onSelectDate(str)}
              className={`flex-1 text-center py-1.5 rounded-lg transition-colors ${
                isSelected ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <p className="text-[10px] font-semibold">
                {MONTHS[d.getMonth()]} {d.getDate()}
              </p>
              <p className="text-[10px]">{WEEKDAYS[d.getDay()]}</p>
              {isSelected && <div className="h-0.5 bg-primary rounded-full mt-1 mx-2" />}
            </button>
          );
        })}
      </div>
      <button onClick={() => shift(1)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}