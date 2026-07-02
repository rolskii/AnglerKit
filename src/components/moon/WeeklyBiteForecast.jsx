import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import FishIcon from '@/components/FishIcon';
import MoonPhaseSymbol from '@/components/MoonPhaseSymbol';

const calculateMoonPhase = (date) => {
  const knownNewMoon = new Date(2000, 0, 6);
  const lunarMonth = 29.53058867;
  const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const daysInCycle = daysSinceNewMoon % lunarMonth;
  const illumination = ((1 - Math.cos(Math.PI * 2 * (daysInCycle / lunarMonth))) / 2) * 100;

  let name = 'New Moon';
  if (daysInCycle < 1.84) name = 'New Moon';
  else if (daysInCycle < 7.38) name = 'Waxing Crescent';
  else if (daysInCycle < 9.23) name = 'First Quarter';
  else if (daysInCycle < 14.77) name = 'Waxing Gibbous';
  else if (daysInCycle < 16.61) name = 'Full Moon';
  else if (daysInCycle < 23.15) name = 'Waning Gibbous';
  else if (daysInCycle < 25) name = 'Last Quarter';
  else name = 'Waning Crescent';

  return { name, illumination, daysInCycle };
};

const calculateFishingRating = (daysInCycle) => {
  const lunarMonth = 29.53058867;
  const distFromNew = Math.min(daysInCycle, lunarMonth - daysInCycle);
  const distFromFull = Math.abs(daysInCycle - lunarMonth / 2);
  const distFromMajor = Math.min(distFromNew, distFromFull);
  if (distFromMajor < 1) return 7;
  if (distFromMajor < 2.5) return 6;
  if (distFromMajor < 4.5) return 5;
  if (distFromMajor < 6) return 4;
  return 3;
};

const getRatingLabel = (rating) => {
  if (rating >= 7) return 'Excellent';
  if (rating >= 6) return 'Very Good';
  if (rating >= 5) return 'Good';
  if (rating >= 4) return 'Fair';
  return 'Moderate';
};

export default function WeeklyBiteForecast({ open, onOpenChange, startDate }) {
  const days = useMemo(() => {
    const base = startDate ? new Date(startDate + 'T00:00:00') : new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(base);
      date.setDate(date.getDate() + i);
      const phase = calculateMoonPhase(date);
      const rating = calculateFishingRating(phase.daysInCycle);
      const percent = Math.round((rating / 7) * 100);
      const isToday = i === 0;
      return {
        date,
        phase,
        rating,
        percent,
        isToday,
        label: isToday
          ? 'Today'
          : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      };
    });
  }, [startDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Weekly Bite Forecast</DialogTitle>
          <DialogDescription>7-day fish bite ratings based on moon phases</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl ${day.isToday ? 'bg-primary/10 border border-primary/20' : 'bg-secondary'}`}
            >
              <MoonPhaseSymbol phase={day.phase} className="w-10 h-10 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{day.label}</p>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <FishIcon
                      key={n}
                      className={`w-9 h-9 text-primary transition-opacity ${n <= day.rating ? 'opacity-100' : 'opacity-25'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-lg font-bold ${day.rating >= 5 ? 'text-green-600' : day.rating <= 3 ? 'text-yellow-600' : 'text-primary'}`}>
                  {day.percent}%
                </p>
                <p className="text-[10px] text-muted-foreground">{getRatingLabel(day.rating)}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}