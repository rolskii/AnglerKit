import React, { useMemo } from 'react';
import { buildSmoothPath, generateFixedIntervalTicks } from '@/lib/chartUtils';
import { useNowTick } from '@/hooks/useNowTick';

const CHART_HEIGHT = 80;
const CHART_WIDTH = 720;
const PAD_TOP_PCT = 0.08;
const PAD_BOTTOM_PCT = 0.08;

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pickTickInterval(dataRange) {
  if (dataRange <= 0.04) return 0.01;
  if (dataRange <= 0.08) return 0.02;
  if (dataRange <= 0.20) return 0.05;
  if (dataRange <= 0.40) return 0.10;
  return 0.20;
}

function formatElevation(v, field) {
  if (v == null || isNaN(v)) return '—';
  return field === 'discharge' ? v.toFixed(1) : v.toFixed(2);
}

// 24h tick axis: major labeled ticks every 3 hours, minor unlabeled notches.
// `nowHour` (0-23, or null) replaces the nearest major tick's label with "Now".
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
              <span className={`text-[11px] mt-0.5 whitespace-nowrap ${isNowLabel ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {isNowLabel ? 'Now' : labelFor(h)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayPanel({ day, field, isToday, unitLabel, normalLevel, overlayHours, sharedBounds }) {
  const points = day.hours;
  const withValues = points.filter(p => p.value != null);
  const gradId = `riverGradient-${field}-${day.dateStr}`;

  const bounds = useMemo(() => {
    if (sharedBounds) return sharedBounds;
    if (withValues.length === 0) return null;
    const vals = withValues.map(p => p.value);
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (normalLevel != null) {
      min = Math.min(min, normalLevel);
      max = Math.max(max, normalLevel);
    }
    if (field === 'level') {
      const interval = pickTickInterval(max - min);
      max = Math.floor(max / interval) * interval + interval;
    }
    let normalY = null;
    if (normalLevel != null) {
      const range = max - min || 1;
      const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
      const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);
      const usableHeight = usableBottom - usableTop;
      normalY = usableBottom - ((normalLevel - min) / range) * usableHeight;
    }
    return { min, max, normalY };
  }, [withValues, normalLevel, field, sharedBounds]);

  const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
  const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);

  const svgPoints = useMemo(() => {
    if (!bounds) return [];
    const { min, max } = bounds;
    const range = max - min || 1;
    const usableHeight = usableBottom - usableTop;
    return points.map(p => {
      const x = (p.hour / 24) * CHART_WIDTH;
      if (p.value == null) return { x, y: null, hour: p.hour, isReal: p.isReal, value: p.value };
      const y = usableBottom - ((p.value - min) / range) * usableHeight;
      return { x, y, hour: p.hour, isReal: p.isReal, value: p.value };
    });
  }, [points, bounds, usableTop, usableBottom]);

  const overlaySvgPoints = useMemo(() => {
    if (!bounds || !overlayHours) return [];
    const { min, max } = bounds;
    const range = max - min || 1;
    const usableHeight = usableBottom - usableTop;
    return overlayHours.map(p => {
      const x = (p.hour / 24) * CHART_WIDTH;
      if (p.value == null) return { x, y: null };
      const y = usableBottom - ((p.value - min) / range) * usableHeight;
      return { x, y };
    });
  }, [overlayHours, bounds, usableTop, usableBottom]);

  const yTicks = useMemo(() => {
    if (!bounds) return [];
    if (field === 'discharge') {
      const mid = (bounds.min + bounds.max) / 2;
      return [
        { y: usableTop, label: formatElevation(bounds.max, field) },
        { y: (usableTop + usableBottom) / 2, label: formatElevation(mid, field) },
        { y: usableBottom, label: formatElevation(bounds.min, field) },
      ];
    }
    const interval = pickTickInterval(bounds.max - bounds.min);
    return generateFixedIntervalTicks(bounds.min, bounds.max, interval, usableTop, usableBottom);
  }, [bounds, field, usableTop, usableBottom]);

  const knownPoints = svgPoints.filter(p => p.y != null);
  const pathD = buildSmoothPath(knownPoints);
  const areaD = knownPoints.length > 0
    ? `${pathD} L ${knownPoints[knownPoints.length - 1].x} ${CHART_HEIGHT} L ${knownPoints[0].x} ${CHART_HEIGHT} Z`
    : '';

  const overlayKnown = (() => {
    const known = overlaySvgPoints.filter(p => p.y != null);
    if (known.length === 0) return [];
    const extended = [...known];
    const first = known[0];
    const last = known[known.length - 1];
    if (first.x > 0) extended.unshift({ x: 0, y: first.y });
    if (last.x < CHART_WIDTH) extended.push({ x: CHART_WIDTH, y: last.y });
    return extended;
  })();
  const overlayPathD = buildSmoothPath(overlayKnown);

  const lastReal = isToday ? [...knownPoints].reverse().find(p => p.isReal) : null;

  return (
    <div className="shrink-0 w-1/2 min-w-0">
      <div className="px-1 mb-1">
        <span className="text-xs font-medium text-muted-foreground">{day.label}</span>
      </div>
      <div className="flex items-stretch gap-1.5">
        <div className="relative w-9 shrink-0" style={{ height: CHART_HEIGHT }}>
          {yTicks.map((tick, i) => (
            <span
              key={i}
              className="absolute right-0 text-[11px] text-muted-foreground whitespace-nowrap"
              style={{ top: `${(tick.y / CHART_HEIGHT) * 100}%`, transform: 'translateY(-50%)' }}
            >
              {tick.label}{unitLabel ? ` ${unitLabel}` : ''}
            </span>
          ))}
        </div>
        <div className="flex-1 min-w-0 relative">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" style={{ height: CHART_HEIGHT }} preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {bounds?.normalY != null && (
              <line x1="0" y1={bounds.normalY} x2={CHART_WIDTH} y2={bounds.normalY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 3" />
            )}
            {areaD && <path d={areaD} fill={`url(#${gradId})`} stroke="none" />}
            {overlayPathD && (
              <path d={overlayPathD} fill="none" stroke="#b91c1c" strokeWidth="1" strokeLinecap="round" />
            )}
            {pathD && <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />}
            {knownPoints.filter(p => p.isReal).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2} fill="hsl(var(--primary))" />
            ))}
            {lastReal && (
              <circle cx={lastReal.x} cy={lastReal.y} r={4} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
            )}
          </svg>
          {bounds?.normalY != null && normalLevel != null && (
            <span className="absolute right-1 top-1 inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-background/80 px-1 rounded whitespace-nowrap">
              <span className="inline-block w-3 border-t border-dashed border-green-500" />
              Normal level ({normalLevel.toFixed(2)}{unitLabel ? ` ${unitLabel}` : ''})
            </span>
          )}
          {overlayPathD && (
            <span className="absolute left-1 top-1 inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-background/80 px-1 rounded whitespace-nowrap">
              <span className="inline-block w-3 border-t border-red-700" />
              Historical
            </span>
          )}
          <HourAxis nowHour={isToday ? new Date().getHours() + new Date().getMinutes() / 60 : null} />
        </div>
      </div>
    </div>
  );
}

export default function RiverLevelChart({ hourly, field = 'level', unitLabel, normalLevel, overlayHourly }) {
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

  const overlayHours = useMemo(() => {
    if (!overlayHourly?.time?.length) return null;
    const values = overlayHourly[field] || [];
    const buckets = new Array(24).fill(null).map((_, h) => ({ hour: h, value: null, isReal: false }));
    const counts = new Array(24).fill(0);
    overlayHourly.time.forEach((t, i) => {
      const v = values[i];
      if (v == null) return;
      const h = new Date(t).getHours();
      if (buckets[h].value == null) {
        buckets[h].value = v;
      } else {
        buckets[h].value = (buckets[h].value * counts[h] + v) / (counts[h] + 1);
      }
      counts[h]++;
      buckets[h].isReal = true;
    });
    return buckets;
  }, [overlayHourly, field]);

  // Shared bounds across all visible days + overlay data so both panels
  // use the same Y-axis scale.
  const sharedBounds = useMemo(() => {
    const allVals = [];
    days.forEach(day => {
      day.hours.forEach(p => {
        if (p.value != null) allVals.push(p.value);
      });
    });
    if (overlayHours) overlayHours.forEach(p => {
      if (p.value != null) allVals.push(p.value);
    });
    if (allVals.length === 0) return null;
    let min = Math.min(...allVals);
    let max = Math.max(...allVals);
    if (normalLevel != null) {
      min = Math.min(min, normalLevel);
      max = Math.max(max, normalLevel);
    }
    if (field === 'level') {
      const interval = pickTickInterval(max - min);
      max = Math.floor(max / interval) * interval + interval;
    }
    const range = max - min || 1;
    const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
    const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);
    const usableHeight = usableBottom - usableTop;
    const normalY = normalLevel != null ? usableBottom - ((normalLevel - min) / range) * usableHeight : null;
    return { min, max, normalY };
  }, [days, overlayHours, normalLevel, field]);

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No hourly data available yet.</p>;
  }

  return (
    <div className="flex gap-2">
      {days.map((day) => (
        <DayPanel key={day.dateStr} day={day} field={field} isToday={day.label === 'Today'} unitLabel={unitLabel} normalLevel={normalLevel} overlayHours={overlayHours} sharedBounds={sharedBounds} />
      ))}
    </div>
  );
}