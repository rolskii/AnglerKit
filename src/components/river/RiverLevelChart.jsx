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

function hourLabel(h) {
  const hh = h % 24;
  if (hh === 0) return '12am';
  if (hh === 12) return '12pm';
  return hh > 12 ? `${hh - 12}pm` : `${hh}am`;
}

// Combined axis spanning yesterday 12am → today's current hour.
// Major ticks every 6 hours; "Now" replaces the nearest tick.
function CombinedHourAxis({ totalHours, nowHour }) {
  const nowH = 24 + nowHour;
  const ticks = [];
  for (let h = 0; h <= totalHours; h += 6) {
    if (h > totalHours) break;
    const isYesterday = h < 24;
    ticks.push({
      h,
      label: isYesterday ? `Y ${hourLabel(h)}` : hourLabel(h),
      isNow: false,
    });
  }
  // Replace the last tick with "Now" if it's close, otherwise add it
  if (nowH > 0 && nowH <= totalHours) {
    const last = ticks[ticks.length - 1];
    if (last && Math.abs(last.h - nowH) < 3) {
      last.h = nowH;
      last.label = 'Now';
      last.isNow = true;
    } else {
      ticks.push({ h: nowH, label: 'Now', isNow: true });
    }
  }

  return (
    <div className="relative h-6 mt-1">
      {ticks.map((tick, i) => {
        const leftPct = (tick.h / totalHours) * 100;
        return (
          <div
            key={i}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-px h-1.5 bg-muted-foreground/50" />
            <span className={`text-[11px] mt-0.5 whitespace-nowrap ${tick.isNow ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              {tick.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function RiverLevelChart({ hourly, field = 'level', unitLabel, normalLevel, overlayHourly }) {
  const now = useNowTick(60000);

  // Combine yesterday (0-23) + today (0-currentHour) into one array.
  const combined = useMemo(() => {
    if (!hourly?.time?.length) return null;
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

    const yHours = byDate[yesterdayStr] || new Array(24).fill(null).map((_, h) => ({ hour: h, value: null, isReal: false }));
    const tHours = byDate[todayStr] || new Array(24).fill(null).map((_, h) => ({ hour: h, value: null, isReal: false }));

    const currentHour = now.getHours();
    return [...yHours, ...tHours.slice(0, currentHour + 1)];
  }, [hourly, field, now]);

  // Bucket historical overlay by local hour (0-23).
  const overlayHours = useMemo(() => {
    if (!overlayHourly?.time?.length) return null;
    const values = overlayHourly[field] || [];
    const buckets = new Array(24).fill(null).map((_, h) => ({ hour: h, value: null }));
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
    });
    return buckets;
  }, [overlayHourly, field]);

  if (!combined) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No hourly data available yet.</p>;
  }

  const totalHours = combined.length;
  const nowHour = now.getHours();

  // Y bounds across current + overlay data
  const allVals = [];
  combined.forEach(p => { if (p.value != null) allVals.push(p.value); });
  if (overlayHours) overlayHours.forEach(p => { if (p.value != null) allVals.push(p.value); });

  let min = allVals.length > 0 ? Math.min(...allVals) : 0;
  let max = allVals.length > 0 ? Math.max(...allVals) : 1;
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

  // Map combined hours to SVG x-coordinates
  const svgPoints = combined.map((p, i) => {
    const x = (i / totalHours) * CHART_WIDTH;
    if (p.value == null) return { x, y: null, isReal: p.isReal };
    const y = usableBottom - ((p.value - min) / range) * usableHeight;
    return { x, y, isReal: p.isReal };
  });

  const knownPoints = svgPoints.filter(p => p.y != null);
  const pathD = buildSmoothPath(knownPoints);
  const areaD = knownPoints.length > 0
    ? `${pathD} L ${knownPoints[knownPoints.length - 1].x} ${CHART_HEIGHT} L ${knownPoints[0].x} ${CHART_HEIGHT} Z`
    : '';

  // Overlay points mapped to the yesterday portion (hours 0-23 → x 0..yesterdayEnd)
  const yesterdayEnd = (24 / totalHours) * CHART_WIDTH;
  const overlaySvgPoints = overlayHours
    ? overlayHours.map((p, i) => {
        const x = (i / totalHours) * CHART_WIDTH;
        if (p.value == null) return { x, y: null };
        const y = usableBottom - ((p.value - min) / range) * usableHeight;
        return { x, y };
      })
    : [];

  const overlayKnown = (() => {
    const known = overlaySvgPoints.filter(p => p.y != null);
    if (known.length === 0) return [];
    const extended = [...known];
    if (known[0].x > 0) extended.unshift({ x: 0, y: known[0].y });
    if (known[known.length - 1].x < yesterdayEnd) extended.push({ x: yesterdayEnd, y: known[known.length - 1].y });
    return extended;
  })();
  const overlayPathD = buildSmoothPath(overlayKnown);

  // Y-axis ticks
  const yTicks = field === 'discharge'
    ? [
        { y: usableTop, label: formatElevation(max, field) },
        { y: (usableTop + usableBottom) / 2, label: formatElevation((min + max) / 2, field) },
        { y: usableBottom, label: formatElevation(min, field) },
      ]
    : generateFixedIntervalTicks(min, max, pickTickInterval(max - min), usableTop, usableBottom);

  const lastReal = [...knownPoints].reverse().find(p => p.isReal);
  const gradId = `riverGradient-${field}-combined`;

  return (
    <div className="w-full">
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
            {normalY != null && (
              <line x1="0" y1={normalY} x2={CHART_WIDTH} y2={normalY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 3" />
            )}
            {/* Day divider at the yesterday/today boundary */}
            <line x1={yesterdayEnd} y1="0" x2={yesterdayEnd} y2={CHART_HEIGHT} stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeOpacity="0.3" strokeDasharray="2 3" />
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
          {/* Day labels */}
          <span className="absolute top-0 left-0 text-[11px] font-medium text-muted-foreground">Yesterday</span>
          <span className="absolute top-0 text-[11px] font-medium text-muted-foreground" style={{ left: `${(yesterdayEnd / CHART_WIDTH) * 100}%`, transform: 'translateX(4px)' }}>Today</span>
          {normalY != null && normalLevel != null && (
            <span className="absolute right-1 bottom-6 inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-background/80 px-1 rounded whitespace-nowrap">
              <span className="inline-block w-3 border-t border-dashed border-green-500" />
              Normal level ({normalLevel.toFixed(2)}{unitLabel ? ` ${unitLabel}` : ''})
            </span>
          )}
          {overlayPathD && (
            <span className="absolute left-1 top-4 inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-background/80 px-1 rounded whitespace-nowrap">
              <span className="inline-block w-3 border-t border-red-700" />
              Historical
            </span>
          )}
          <CombinedHourAxis totalHours={totalHours} nowHour={nowHour} />
        </div>
      </div>
    </div>
  );
}