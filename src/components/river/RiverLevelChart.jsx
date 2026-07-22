import React, { useMemo, useState, useRef } from 'react';
import { buildSmoothPath, generateFixedIntervalTicks } from '@/lib/chartUtils';
import { Loader2 } from 'lucide-react';
import ChartTooltip from './ChartTooltip';

const CHART_HEIGHT = 180;
const CHART_WIDTH = 720;
const PAD_TOP_PCT = 0.08;
const PAD_BOTTOM_PCT = 0.08;

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pickTickInterval(dataRange) {
  if (dataRange <= 0.02) return 0.005;
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
        const hideLabel = h === 24;
        return (
          <div
            key={h}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${leftPct}%`, transform: 'translateX(-50%)' }}
          >
            <div className={isMajor ? 'w-px h-1.5 bg-muted-foreground/50' : 'w-px h-1 bg-muted-foreground/25'} />
            {isMajor && !hideLabel && (
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

// Build a 24-hour array (12am–12am) for today from hourly readings.
function buildHours(hourlyData, field, targetDateStr) {
  if (!hourlyData?.time?.length) return new Array(25).fill(null).map((_, h) => ({ hour: h, value: null, isReal: false }));
  const byDate = {};
  hourlyData.time.forEach((t, i) => {
    const d = new Date(t);
    const dateStr = localDateStr(d);
    if (!byDate[dateStr]) byDate[dateStr] = new Array(24).fill(null).map((_, h) => ({ hour: h, value: null, isReal: false }));
    const hour = d.getHours();
    byDate[dateStr][hour] = { hour, value: hourlyData[field]?.[i] ?? null, isReal: true };
  });
  const dayHours = byDate[targetDateStr] || new Array(24).fill(null).map((_, h) => ({ hour: h, value: null, isReal: false }));
  return [...dayHours, { hour: 24, value: null, isReal: false }];
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

function formatHourLabel(h) {
  const hh = h % 24;
  if (hh === 0) return '12:00 AM';
  if (hh === 12) return '12:00 PM';
  return hh > 12 ? `${hh - 12}:00 PM` : `${hh}:00 AM`;
}

function ChartPanel({ hourlyData, field, normalLevel, overlayBuckets, overlayLabel, bounds, isToday, nowHour, loading, yTicks, unitLabel }) {
  const [activeHour, setActiveHour] = useState(null);
  const lastTapRef = useRef(0);
  const targetDateStr = hourlyData?._targetDateStr || localDateStr(new Date());
  const hours = useMemo(() => buildHours(hourlyData, field, targetDateStr), [hourlyData, field, targetDateStr]);
  const hoursLevel = useMemo(() => buildHours(hourlyData, 'level', targetDateStr), [hourlyData, targetDateStr]);
  const hoursDischarge = useMemo(() => buildHours(hourlyData, 'discharge', targetDateStr), [hourlyData, targetDateStr]);

  const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
  const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);

  const { min, max, normalY } = bounds || { min: 0, max: 1, normalY: null, usableTop, usableBottom };
  const range = max - min || 1;
  const usableHeight = usableBottom - usableTop;

  const svgPoints = hours.map(p => {
    const x = (p.hour / 24) * CHART_WIDTH;
    if (p.value == null) return { x, y: null, isReal: p.isReal };
    const y = usableBottom - ((p.value - min) / range) * usableHeight;
    return { x, y, isReal: p.isReal };
  });

  const knownPoints = svgPoints.filter(p => p.y != null);
  const filledPoints = svgPoints.map((p, i) => {
    if (p.y != null) return p;
    let prevIdx = i - 1;
    while (prevIdx >= 0 && svgPoints[prevIdx].y == null) prevIdx--;
    let nextIdx = i + 1;
    while (nextIdx < svgPoints.length && svgPoints[nextIdx].y == null) nextIdx++;
    const prev = prevIdx >= 0 ? svgPoints[prevIdx] : null;
    const next = nextIdx < svgPoints.length ? svgPoints[nextIdx] : null;
    if (prev && next) {
      const t = (p.x - prev.x) / (next.x - prev.x || 1);
      return { x: p.x, y: prev.y + t * (next.y - prev.y), isReal: false };
    }
    if (prev) return { x: p.x, y: prev.y, isReal: false };
    if (next) return { x: p.x, y: next.y, isReal: false };
    return { x: p.x, y: null, isReal: false };
  }).filter(p => p.y != null);

  const nowX = isToday && nowHour != null ? (nowHour / 24) * CHART_WIDTH : null;
  let visiblePoints = filledPoints;
  if (nowX != null) {
    visiblePoints = filledPoints.filter(p => p.x <= nowX + 0.5);
    if (visiblePoints.length > 0 && visiblePoints[visiblePoints.length - 1].x < nowX) {
      visiblePoints = [...visiblePoints, { x: nowX, y: visiblePoints[visiblePoints.length - 1].y, isReal: false }];
    }
  }

  const pathD = buildSmoothPath(visiblePoints);
  const gradId = `riverGradient-${field}`;
  const areaD = visiblePoints.length > 0
    ? `${pathD} L ${visiblePoints[visiblePoints.length - 1].x} ${CHART_HEIGHT} L ${visiblePoints[0].x} ${CHART_HEIGHT} Z`
    : '';

  const lastReal = isToday ? [...knownPoints].reverse().find(p => p.isReal) : null;

  const activeLevel = activeHour != null ? interpolateValue(hoursLevel, activeHour) : null;
  const activeDischarge = activeHour != null ? interpolateValue(hoursDischarge, activeHour) : null;
  const hasOverlayData = overlayBuckets?.some(b => b.level != null || b.discharge != null);
  const activeOverlayLevel = activeHour != null && hasOverlayData ? interpolateValue(overlayBuckets, activeHour, 'level') : null;
  const activeOverlayDischarge = activeHour != null && hasOverlayData ? interpolateValue(overlayBuckets, activeHour, 'discharge') : null;
  const activeX = activeHour != null ? (activeHour / 24) * CHART_WIDTH : null;
  const activeLevelY = activeLevel != null ? usableBottom - ((activeLevel - min) / range) * usableHeight : null;

  const handleChartClick = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      setActiveHour(null);
      return;
    }
    lastTapRef.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const hour = Math.round(pct * 24);
    if (hour > 24) return;
    setActiveHour(prev => prev === hour ? null : hour);
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
        <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full cursor-pointer" style={{ height: CHART_HEIGHT, touchAction: 'manipulation' }} preserveAspectRatio="none" onClick={handleChartClick}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          {/* Horizontal grid lines for more visual y-axis intervals */}
          {yTicks.map((tick, i) => (
            <line key={`grid-${i}`} x1="0" y1={tick.y} x2={CHART_WIDTH} y2={tick.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.5" vectorEffect="non-scaling-stroke" />
          ))}
          {normalY != null && (
            <line x1="0" y1={normalY} x2={CHART_WIDTH} y2={normalY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 3" />
          )}
          {areaD && <path d={areaD} fill={`url(#${gradId})`} stroke="none" />}
          {pathD && <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />}
          {knownPoints.filter(p => p.isReal).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2} fill="hsl(var(--primary))" />
          ))}
          {lastReal && (
            <circle cx={lastReal.x} cy={lastReal.y} r={4} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
          )}
          {activeX != null && (
            <line x1={activeX} y1="0" x2={activeX} y2={CHART_HEIGHT} stroke="hsl(var(--foreground))" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" vectorEffect="non-scaling-stroke" />
          )}
          {activeX != null && activeLevelY != null && (
            <circle cx={activeX} cy={activeLevelY} r="4" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
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

        {activeHour != null && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${(activeHour / 24) * 100}%`,
              top: '2px',
              transform: `translateX(${activeHour >= 18 ? '-100%' : activeHour >= 7 ? '-50%' : '0'})`,
            }}
          >
            <ChartTooltip
              hourLabel={formatHourLabel(activeHour)}
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
      <HourAxis nowHour={nowHour} />
    </div>
  );
}

export default function RiverLevelChart({ hourly, field = 'level', unitLabel, normalLevel, overlayHourly, overlayLabel }) {
  const todayDateStr = localDateStr(new Date());

  // Tag the hourly data with today's date string for buildHours.
  const todayData = useMemo(() => {
    if (!hourly?.time?.length) return null;
    return { ...hourly, _targetDateStr: todayDateStr };
  }, [hourly, todayDateStr]);

  // Bucket overlay into hourly averages — both level and discharge so
  // the tooltip can show both fields regardless of which is charted.
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

  // Y bounds from today's data + normal level.
  const bounds = useMemo(() => {
    if (!todayData?.time?.length) return null;
    const allVals = [];
    const values = todayData[field] || [];
    values.forEach(v => { if (v != null) allVals.push(v); });
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
  }, [todayData, field, normalLevel]);

  const yTicks = useMemo(() => {
    if (!bounds) return [];
    const { min, max, usableTop, usableBottom } = bounds;
    if (field === 'discharge') {
      const interval = pickTickInterval(max - min);
      return generateFixedIntervalTicks(min, max, interval, usableTop, usableBottom);
    }
    return generateFixedIntervalTicks(min, max, pickTickInterval(max - min), usableTop, usableBottom);
  }, [bounds, field]);

  const loading = !todayData;

  return (
    <div className="w-full">
      <ChartPanel
        hourlyData={todayData}
        field={field}
        unitLabel={unitLabel}
        normalLevel={normalLevel}
        overlayBuckets={overlayBuckets}
        overlayLabel={overlayLabel}
        bounds={bounds}
        isToday={true}
        nowHour={new Date().getHours() + new Date().getMinutes() / 60}
        loading={loading}
        yTicks={yTicks}
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