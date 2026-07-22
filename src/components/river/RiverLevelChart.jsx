import React, { useMemo, useState, useRef } from 'react';
import { buildSmoothPath, generateFixedIntervalTicks } from '@/lib/chartUtils';
import { useNowTick } from '@/hooks/useNowTick';
import { Loader2 } from 'lucide-react';
import ChartTooltip from './ChartTooltip';

const CHART_HEIGHT = 180;
const CHART_WIDTH = 720;
const PAD_TOP_PCT = 0.08;
const PAD_BOTTOM_PCT = 0.08;
const WINDOW_HOURS = 24;

function pickTickInterval(dataRange) {
  if (dataRange <= 0.01) return 0.002;
  if (dataRange <= 0.02) return 0.005;
  if (dataRange <= 0.04) return 0.01;
  if (dataRange <= 0.08) return 0.02;
  if (dataRange <= 0.16) return 0.04;
  if (dataRange <= 0.30) return 0.05;
  if (dataRange <= 0.60) return 0.10;
  return 0.20;
}

function formatTimeLabel(ts) {
  if (ts == null) return '—';
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Build raw points within the rolling 12-hour window ending at nowMs.
// Each point carries both level and discharge so the tooltip can show
// both fields regardless of which is charted.
function buildRollingPoints(hourlyData, nowMs) {
  if (!hourlyData?.time?.length) return [];
  const windowStartMs = nowMs - WINDOW_HOURS * 3600000;
  const points = [];
  hourlyData.time.forEach((t, i) => {
    const ts = new Date(t).getTime();
    if (ts < windowStartMs || ts > nowMs) return;
    const x = ((ts - windowStartMs) / (WINDOW_HOURS * 3600000)) * CHART_WIDTH;
    points.push({
      x,
      ts,
      level: hourlyData.level?.[i] ?? null,
      discharge: hourlyData.discharge?.[i] ?? null,
    });
  });
  return points.sort((a, b) => a.ts - b.ts);
}

function interpolateValue(dataArray, targetIdx, field) {
  if (targetIdx == null || !dataArray?.length) return null;
  const point = dataArray[targetIdx];
  const val = field ? point?.[field] : point?.value;
  if (val != null) return val;
  let prevIdx = targetIdx - 1;
  while (prevIdx >= 0) {
    const v = field ? dataArray[prevIdx]?.[field] : dataArray[prevIdx]?.value;
    if (v != null) break;
    prevIdx--;
  }
  let nextIdx = targetIdx + 1;
  while (nextIdx < dataArray.length) {
    const v = field ? dataArray[nextIdx]?.[field] : dataArray[nextIdx]?.value;
    if (v != null) break;
    nextIdx++;
  }
  const prev = prevIdx >= 0 ? (field ? dataArray[prevIdx]?.[field] : dataArray[prevIdx]?.value) : null;
  const next = nextIdx < dataArray.length ? (field ? dataArray[nextIdx]?.[field] : dataArray[nextIdx]?.value) : null;
  if (prev != null && next != null) {
    const t = (targetIdx - prevIdx) / (nextIdx - prevIdx || 1);
    return prev + t * (next - prev);
  }
  if (prev != null) return prev;
  if (next != null) return next;
  return null;
}

function RollingTimeAxis({ windowStartMs, nowMs }) {
  // Ticks at every clock hour within the rolling window. Major labels
  // at 3-hour boundaries (12am, 3, 6, 9, 12pm, 3, 6, 9); "Now" at right edge.
  const labelFor = (hourOfDay) => {
    if (hourOfDay === 0) return '12am';
    if (hourOfDay === 12) return '12pm';
    return hourOfDay > 12 ? `${hourOfDay - 12}` : `${hourOfDay}`;
  };

  const ticks = [];
  const firstHour = new Date(windowStartMs);
  firstHour.setMinutes(0, 0, 0);
  if (firstHour.getTime() < windowStartMs) {
    firstHour.setTime(firstHour.getTime() + 3600000);
  }
  for (let ts = firstHour.getTime(); ts <= nowMs; ts += 3600000) {
    const d = new Date(ts);
    const hourOfDay = d.getHours();
    const leftPct = ((ts - windowStartMs) / (WINDOW_HOURS * 3600000)) * 100;
    const isMajor = hourOfDay % 3 === 0;
    const hideLabel = leftPct > 93; // avoid overlap with "Now"
    ticks.push({ ts, leftPct, isMajor, hourOfDay, hideLabel });
  }

  return (
    <div className="relative h-6 mt-1">
      {ticks.map((tick, i) => (
        <div
          key={i}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${tick.leftPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className={tick.isMajor ? 'w-px h-1.5 bg-muted-foreground/50' : 'w-px h-1 bg-muted-foreground/25'} />
          {tick.isMajor && !tick.hideLabel && (
            <span className="text-[11px] mt-0.5 whitespace-nowrap text-muted-foreground">
              {labelFor(tick.hourOfDay)}
            </span>
          )}
        </div>
      ))}

    </div>
  );
}

function ChartPanel({ hourlyData, field, normalLevel, overlayBuckets, overlayLabel, bounds, loading, yTicks, unitLabel, nowMs }) {
  const [activeX, setActiveX] = useState(null);
  const lastTapRef = useRef(0);

  const points = useMemo(() => buildRollingPoints(hourlyData, nowMs), [hourlyData, nowMs]);
  const windowStartMs = nowMs - WINDOW_HOURS * 3600000;

  const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
  const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);
  const { min, max, normalY } = bounds || { min: 0, max: 1, normalY: null };
  const range = max - min || 1;
  const usableHeight = usableBottom - usableTop;

  // Map raw points to SVG coordinates for the charted field.
  const knownPoints = useMemo(() => {
    return points
      .map(p => {
        const val = p[field];
        const y = val != null ? usableBottom - ((val - min) / range) * usableHeight : null;
        return { ...p, y };
      })
      .filter(p => p.y != null);
  }, [points, field, min, range, usableHeight, usableBottom]);

  const pathD = buildSmoothPath(knownPoints);
  const gradId = `riverGradient-${field}`;
  const areaD = knownPoints.length > 0
    ? `${pathD} L ${knownPoints[knownPoints.length - 1].x} ${CHART_HEIGHT} L ${knownPoints[0].x} ${CHART_HEIGHT} Z`
    : '';

  const lastReal = knownPoints.length > 0 ? knownPoints[knownPoints.length - 1] : null;

  // Find nearest data point to the active x position for the tooltip.
  const activePoint = activeX != null && knownPoints.length > 0
    ? knownPoints.reduce((best, p) => (Math.abs(p.x - activeX) < Math.abs(best.x - activeX) ? p : best), knownPoints[0])
    : null;

  const activeLevel = activePoint?.level ?? null;
  const activeDischarge = activePoint?.discharge ?? null;
  const hasOverlayData = overlayBuckets?.some(b => b.level != null || b.discharge != null);
  const activeHourOfDay = activePoint ? new Date(activePoint.ts).getHours() : null;
  const activeOverlayLevel = activeHourOfDay != null && hasOverlayData ? interpolateValue(overlayBuckets, activeHourOfDay, 'level') : null;
  const activeOverlayDischarge = activeHourOfDay != null && hasOverlayData ? interpolateValue(overlayBuckets, activeHourOfDay, 'discharge') : null;
  const activeLevelY = activeLevel != null ? usableBottom - ((activeLevel - min) / range) * usableHeight : null;

  const draggingRef = useRef(false);

  const xFromEvent = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return pct * CHART_WIDTH;
  };

  const handlePointerDown = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      setActiveX(null);
      return;
    }
    lastTapRef.current = now;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setActiveX(xFromEvent(e));
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    setActiveX(xFromEvent(e));
  };

  const handlePointerUp = (e) => {
    draggingRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="relative" style={{ height: CHART_HEIGHT }}>
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full cursor-pointer" style={{ height: CHART_HEIGHT, touchAction: 'none' }} preserveAspectRatio="none" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {yTicks.map((tick, i) => (
            <line key={`grid-${i}`} x1="0" y1={tick.y} x2={CHART_WIDTH} y2={tick.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" vectorEffect="non-scaling-stroke" />
          ))}
          {normalY != null && (
            <line x1="0" y1={normalY} x2={CHART_WIDTH} y2={normalY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 3" />
          )}
          {areaD && <path d={areaD} fill={`url(#${gradId})`} stroke="none" />}
          {pathD && <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />}
          {lastReal && (
            <circle cx={lastReal.x} cy={lastReal.y} r={4} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
          )}
          {activePoint && (
            <line x1={activePoint.x} y1="0" x2={activePoint.x} y2={CHART_HEIGHT} stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" vectorEffect="non-scaling-stroke" />
          )}
          {activePoint && activeLevelY != null && (
            <circle cx={activePoint.x} cy={activeLevelY} r={4} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
          )}
        </svg>

        {/* Y-axis labels overlaid on top of the chart */}
        {yTicks.map((tick, i) => (
          <span
            key={`ylabel-${i}`}
            className="absolute left-0 text-[10px] text-muted-foreground/80 whitespace-nowrap bg-background/60 px-0.5 rounded-sm"
            style={{ top: `${(tick.y / CHART_HEIGHT) * 100}%`, transform: 'translateY(-50%)' }}
          >
            {tick.label}{unitLabel ? ` ${unitLabel}` : ''}
          </span>
        ))}

        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${(activePoint.x / CHART_WIDTH) * 100}%`,
              top: '2px',
              transform: `translateX(${activePoint.x >= CHART_WIDTH * 0.75 ? '-100%' : activePoint.x >= CHART_WIDTH * 0.3 ? '-50%' : '0'})`,
            }}
          >
            <ChartTooltip
              hourLabel={formatTimeLabel(activePoint.ts)}
              level={activeLevel}
              discharge={activeDischarge}
              overlayLabel={overlayLabel}
              overlayLevel={hasOverlayData ? activeOverlayLevel : null}
              overlayDischarge={hasOverlayData ? activeOverlayDischarge : null}
              hasOverlay={hasOverlayData}
            />
          </div>
        )}
      </div>
      <RollingTimeAxis windowStartMs={windowStartMs} nowMs={nowMs} />
    </div>
  );
}

export default function RiverLevelChart({ hourly, field = 'level', unitLabel, normalLevel, overlayHourly, overlayLabel }) {
  // Re-render every 60s so the 12-hour window slides forward as time progresses.
  const now = useNowTick(60000);
  const nowMs = now.getTime();

  // Bucket overlay into hourly averages by hour-of-day — both level and
  // discharge so the tooltip can show both fields regardless of which
  // is charted. Looked up by hour-of-day of the active data point.
  const overlayBuckets = useMemo(() => {
    if (!overlayHourly?.time?.length) return null;
    const buckets = new Array(24).fill(null).map((_, h) => ({ hour: h, level: null, discharge: null }));
    const levelCounts = new Array(24).fill(0);
    const dischargeCounts = new Array(24).fill(0);
    overlayHourly.time.forEach((t, i) => {
      const h = new Date(t).getHours();
      const lv = overlayHourly.level?.[i];
      const dv = overlayHourly.discharge?.[i];
      if (lv != null) {
        if (buckets[h].level == null) buckets[h].level = lv;
        else buckets[h].level = (buckets[h].level * levelCounts[h] + lv) / (levelCounts[h] + 1);
        levelCounts[h]++;
      }
      if (dv != null) {
        if (buckets[h].discharge == null) buckets[h].discharge = dv;
        else buckets[h].discharge = (buckets[h].discharge * dischargeCounts[h] + dv) / (dischargeCounts[h] + 1);
        dischargeCounts[h]++;
      }
    });
    const firstLevel = buckets.find(b => b.level != null)?.level ?? null;
    const firstDischarge = buckets.find(b => b.discharge != null)?.discharge ?? null;
    return [...buckets, { hour: 24, level: firstLevel, discharge: firstDischarge }];
  }, [overlayHourly]);

  // Y bounds from the rolling 12-hour window of data + normal level.
  const bounds = useMemo(() => {
    if (!hourly?.time?.length) return null;
    const windowStartMs = nowMs - WINDOW_HOURS * 3600000;
    const allVals = [];
    hourly.time.forEach((t, i) => {
      const ts = new Date(t).getTime();
      if (ts < windowStartMs || ts > nowMs) return;
      const v = hourly[field]?.[i];
      if (v != null) allVals.push(v);
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
      min = Math.floor(min / interval) * interval;
    }
    const range = max - min || 1;
    const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
    const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);
    const usableHeight = usableBottom - usableTop;
    const normalY = normalLevel != null ? usableBottom - ((normalLevel - min) / range) * usableHeight : null;
    return { min, max, normalY, usableTop, usableBottom };
  }, [hourly, field, normalLevel, nowMs]);

  const yTicks = useMemo(() => {
    if (!bounds) return [];
    const { min, max, usableTop, usableBottom } = bounds;
    if (field === 'discharge') {
      const interval = pickTickInterval(max - min);
      return generateFixedIntervalTicks(min, max, interval, usableTop, usableBottom);
    }
    return generateFixedIntervalTicks(min, max, pickTickInterval(max - min), usableTop, usableBottom);
  }, [bounds, field]);

  const loading = !hourly?.time?.length;

  return (
    <div className="w-full">
      <ChartPanel
        hourlyData={hourly}
        field={field}
        unitLabel={unitLabel}
        normalLevel={normalLevel}
        overlayBuckets={overlayBuckets}
        overlayLabel={overlayLabel}
        bounds={bounds}
        loading={loading}
        yTicks={yTicks}
        nowMs={nowMs}
      />

      {/* Legend */}
      {normalLevel != null && (
        <div className="flex items-center gap-3 mt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 whitespace-nowrap">
            <span className="inline-block w-3 border-t border-dashed border-green-500" />
            Normal level ({normalLevel.toFixed(2)}{unitLabel ? ` ${unitLabel}` : ''})
          </span>
        </div>
      )}
    </div>
  );
}