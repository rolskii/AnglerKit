import React, { useEffect, useMemo, useRef } from 'react';
import { buildSmoothPath } from '@/lib/chartUtils';
import { useNowTick } from '@/hooks/useNowTick';

const CHART_HEIGHT = 160;
const CHART_WIDTH = 720;
const PAD_TOP_PCT = 0.08;
const PAD_BOTTOM_PCT = 0.08;

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 24h tick axis matching the Moon page's chart: major labeled ticks every
// 3 hours, minor unlabeled notches for the hours in between. `nowHour`
// (0-23, or null) replaces the nearest major tick's label with "Now".
function HourAxis({ nowHour }) {
  const majorHours = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const labelFor = (h) => {
    const hh = h % 24;
    if (hh === 0) return '12am';
    if (hh === 12) return '12pm';
    return hh > 12 ? `${hh - 12}pm` : `${hh}am`;
  };
  const nearestMajor = nowHour != null ? majorHours.reduce((best, h) => (Math.abs(h - nowHour) < Math.abs(best - nowHour) ? h : best), 0) : null;

  return (
    <div className="relative h-6 mt-1">
      {Array.from({ length: 25 }, (_, h) => h).map((h) => {
        const isMajor = h % 3 === 0;
        const leftPct = (h / 24) * 100;
        const isNowLabel = isMajor && h === nearestMajor;
        return (
          <div
            key={h}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
          >
            <div className={isMajor ? 'w-px h-1.5 bg-muted-foreground/50' : 'w-px h-1 bg-muted-foreground/25'} />
            {isMajor && (
              <span className={`text-[9px] mt-0.5 whitespace-nowrap ${isNowLabel ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {isNowLabel ? 'Now' : labelFor(h)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayPanel({ day, field, isToday, unitLabel }) {
  const points = day.hours; // [{hour, value, isReal}]
  const withValues = points.filter(p => p.value != null);
  const gradId = `riverGradient-${field}-${day.dateStr}`;

  const svgPoints = useMemo(() => {
    if (withValues.length === 0) return [];
    const min = Math.min(...withValues.map(p => p.value));
    const max = Math.max(...withValues.map(p => p.value));
    const range = max - min || 1;
    const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
    const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);
    const usableHeight = usableBottom - usableTop;
    return points.map(p => {
      const x = (p.hour / 24) * CHART_WIDTH;
      if (p.value == null) return { x, y: null, hour: p.hour, isReal: p.isReal, value: p.value };
      const y = usableBottom - ((p.value - min) / range) * usableHeight;
      return { x, y, hour: p.hour, isReal: p.isReal, value: p.value };
    });
  }, [points, withValues]);

  const knownPoints = svgPoints.filter(p => p.y != null);
  const pathD = buildSmoothPath(knownPoints);
  const areaD = knownPoints.length > 0
    ? `${pathD} L ${knownPoints[knownPoints.length - 1].x} ${CHART_HEIGHT} L ${knownPoints[0].x} ${CHART_HEIGHT} Z`
    : '';

  const lastReal = isToday ? [...knownPoints].reverse().find(p => p.isReal) : null;

  return (
    <div
      className="shrink-0 w-full"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-xs font-medium text-muted-foreground">{day.label}</span>
        {unitLabel && <span className="text-xs text-muted-foreground">{unitLabel}</span>}
      </div>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" style={{ height: CHART_HEIGHT }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {areaD && <path d={areaD} fill={`url(#${gradId})`} stroke="none" />}
        {pathD && <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />}
        {knownPoints.filter(p => p.isReal).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="hsl(var(--primary))" />
        ))}
        {lastReal && (
          <circle cx={lastReal.x} cy={lastReal.y} r={4} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
        )}
      </svg>
      <HourAxis nowHour={isToday ? new Date().getHours() + new Date().getMinutes() / 60 : null} />
    </div>
  );
}

export default function RiverLevelChart({ hourly, field = 'level', scrollToToday = true, unitLabel }) {
  const scrollRef = useRef(null);
  const now = useNowTick(60000);

  const days = useMemo(() => {
    if (!hourly?.time?.length) return [];
    const byDate = {};
    hourly.time.forEach((t, i) => {
      const d = new Date(t);
      const dateStr = localDateStr(d);
      if (!byDate[dateStr]) byDate[dateStr] = new Array(24).fill(null).map((_, h) => ({ hour: h, value: null, isReal: false }));
      const hour = d.getHours();
      byDate[dateStr][hour] = { hour, value: hourly[field]?.[i] ?? null, isReal: true };
    });
    const todayStr = localDateStr(now);
    const yesterdayStr = localDateStr(new Date(now.getTime() - 86400000));
    const order = [yesterdayStr, todayStr].filter(d => byDate[d]);
    return order.map(dateStr => ({
      dateStr,
      label: dateStr === todayStr ? 'Today' : dateStr === yesterdayStr ? 'Yesterday' : dateStr,
      hours: byDate[dateStr],
    }));
  }, [hourly, field, now]);

  useEffect(() => {
    if (scrollToToday && scrollRef.current && days.length > 0) {
      scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'instant' });
    }
    // Only re-run when the number of day-panels changes (new day rolled in),
    // not on every minute tick — otherwise a manual scroll gets yanked back.
  }, [days.length]);

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No hourly data available yet.</p>;
  }

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto scrollbar-hide"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {days.map((day) => (
        <DayPanel key={day.dateStr} day={day} field={field} isToday={day.label === 'Today'} unitLabel={unitLabel} />
      ))}
    </div>
  );
}
