import React, { useMemo, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { buildSmoothPath, generateFixedIntervalTicks } from '@/lib/chartUtils';
import { useNowTick } from '@/hooks/useNowTick';
import { Loader2 } from 'lucide-react';

const CHART_HEIGHT = 120;
const CHART_WIDTH = 720;
const PAD_TOP_PCT = 0.08;
const PAD_BOTTOM_PCT = 0.08;
const FETCH_DAYS = 7;

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
        // h=24 is the same midnight as the next panel's h=0 — skip the label
        // so there's only one "12am" at each day boundary.
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

// Build a 24-hour array (12am–12am) for a given day from hourly readings.
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
  // Hour 24 = midnight at the right edge. Value is null so the interpolation
  // carries forward the last known reading — this makes the line reach the
  // panel edge and line up with the next day's hour 0 (same midnight tick).
  return [...dayHours, { hour: 24, value: null, isReal: false }];
}

function DayPanel({ hourlyData, field, unitLabel, normalLevel, overlayHours, sharedBounds, isToday, nowHour, loading }) {
  const hours = useMemo(() => buildHours(hourlyData, field, hourlyData?._targetDateStr || ''), [hourlyData, field]);

  const usableTop = CHART_HEIGHT * PAD_TOP_PCT;
  const usableBottom = CHART_HEIGHT * (1 - PAD_BOTTOM_PCT);

  const bounds = sharedBounds || { min: 0, max: 1, normalY: null, usableTop, usableBottom };
  const { min, max, normalY } = bounds;
  const range = max - min || 1;
  const usableHeight = usableBottom - usableTop;

  const svgPoints = hours.map(p => {
    const x = (p.hour / 24) * CHART_WIDTH;
    if (p.value == null) return { x, y: null, isReal: p.isReal };
    const y = usableBottom - ((p.value - min) / range) * usableHeight;
    return { x, y, isReal: p.isReal };
  });

  const overlaySvgPoints = overlayHours
    ? overlayHours.map(p => {
        const x = (p.hour / 24) * CHART_WIDTH;
        if (p.value == null) return { x, y: null };
        const y = usableBottom - ((p.value - min) / range) * usableHeight;
        return { x, y };
      })
    : [];

  // Interpolate null hours so the line is continuous across the full 24h
  // axis — gaps between sparse readings are filled with linear
  // interpolation, and edges carry forward/backward the nearest known value.
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

  // For today, end the line at the current time instead of extending to midnight.
  const nowX = isToday && nowHour != null ? (nowHour / 24) * CHART_WIDTH : null;
  let visiblePoints = filledPoints;
  if (nowX != null) {
    visiblePoints = filledPoints.filter(p => p.x <= nowX + 0.5);
    if (visiblePoints.length > 0 && visiblePoints[visiblePoints.length - 1].x < nowX) {
      visiblePoints = [...visiblePoints, { x: nowX, y: visiblePoints[visiblePoints.length - 1].y, isReal: false }];
    }
  }

  const pathD = buildSmoothPath(visiblePoints);
  const gradId = `riverGradient-${field}-${isToday ? 'today' : hourlyData?._targetDateStr || 'hist'}`;
  const areaD = visiblePoints.length > 0
    ? `${pathD} L ${visiblePoints[visiblePoints.length - 1].x} ${CHART_HEIGHT} L ${visiblePoints[0].x} ${CHART_HEIGHT} Z`
    : '';

  const overlayKnown = (() => {
    const known = overlaySvgPoints.filter(p => p.y != null);
    if (known.length === 0) return [];
    const extended = [...known];
    if (known[0].x > 0) extended.unshift({ x: 0, y: known[0].y });
    if (known[known.length - 1].x < CHART_WIDTH) extended.push({ x: CHART_WIDTH, y: known[known.length - 1].y });
    return extended;
  })();
  const overlayPathD = buildSmoothPath(overlayKnown);

  const lastReal = isToday ? [...knownPoints].reverse().find(p => p.isReal) : null;

  return (
    <div className="w-full relative">
      {loading ? (
        <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
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
            <HourAxis nowHour={nowHour} />
          </>
        )}
    </div>
  );
}

export default function RiverLevelChart({ hourly, field = 'level', unitLabel, normalLevel, overlayHourly, stationId, stationName }) {
  const now = useNowTick(60000);
  const scrollRef = useRef(null);
  const didInitialScroll = useRef(false);
  const mountDate = useRef(new Date());

  // Build the date list once on mount — stable reference.
  const dates = useMemo(() => {
    const arr = [];
    const today = mountDate.current;
    for (let i = FETCH_DAYS - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const dateStr = localDateStr(d);
      arr.push({
        dateStr,
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: i === 0,
      });
    }
    return arr;
  }, []);

  // Fetch each historical day sequentially (most recent first) so the user
  // can start scrolling back as soon as yesterday is loaded.
  const [dayDataMap, setDayDataMap] = useState({});
  useEffect(() => {
    if (!stationId) return;
    let cancelled = false;
    setDayDataMap({});
    didInitialScroll.current = false;

    const load = async () => {
      for (const date of [...dates].reverse()) {
        if (date.isToday) continue;
        if (cancelled) return;
        try {
          const res = await base44.functions.invoke('hydrometric', {
            stationId,
            stationName,
            historicalRange: 'custom',
            startDate: date.dateStr,
            tzOffset: new Date().getTimezoneOffset(),
          });
          if (!cancelled) {
            const hist = res.data?.historical || null;
            setDayDataMap(prev => ({ ...prev, [date.dateStr]: { ...hist, _targetDateStr: date.dateStr } }));
          }
        } catch (e) {
          if (!cancelled) {
            setDayDataMap(prev => ({ ...prev, [date.dateStr]: { _targetDateStr: date.dateStr } }));
          }
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [stationId, stationName, dates]);

  // Keep today's entry in sync with the live hourly prop.
  const todayDateStr = dates[dates.length - 1]?.dateStr;
  useEffect(() => {
    if (hourly && todayDateStr) {
      setDayDataMap(prev => ({
        ...prev,
        [todayDateStr]: { ...hourly, _targetDateStr: todayDateStr },
      }));
    }
  }, [hourly, todayDateStr]);

  // Scroll to today once data is available.
  useEffect(() => {
    if (didInitialScroll.current || !scrollRef.current) return;
    const todayEntry = dayDataMap[todayDateStr];
    if (!todayEntry) return;
    const lastChild = scrollRef.current.children[dates.length - 1];
    if (lastChild) {
      scrollRef.current.scrollLeft = lastChild.offsetLeft - scrollRef.current.offsetLeft;
      didInitialScroll.current = true;
    }
  }, [dayDataMap, todayDateStr, dates]);

  // Bucket overlay into hourly averages (today only).
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
    // Hour 24 wraps to hour 0's value so the red line connects seamlessly
    // across day boundaries (the overlay repeats on every panel).
    const firstVal = buckets.find(b => b.value != null)?.value ?? null;
    return [...buckets, { hour: 24, value: firstVal }];
  }, [overlayHourly, field]);

  // Shared Y bounds across all loaded days + overlay.
  const sharedBounds = useMemo(() => {
    const allVals = [];
    dates.forEach(d => {
      const data = dayDataMap[d.dateStr];
      if (!data?.time) return;
      const values = data[field] || [];
      values.forEach(v => { if (v != null) allVals.push(v); });
    });
    if (overlayHours) overlayHours.forEach(p => { if (p.value != null) allVals.push(p.value); });
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
    return { min, max, normalY, usableTop, usableBottom };
  }, [dates, dayDataMap, field, normalLevel, overlayHours]);

  const hasOverlay = overlayHours?.some(p => p.value != null);

  const yTicks = useMemo(() => {
    if (!sharedBounds) return [];
    const { min, max, usableTop, usableBottom } = sharedBounds;
    if (field === 'discharge') {
      return [
        { y: usableTop, label: formatElevation(max, field) },
        { y: (usableTop + usableBottom) / 2, label: formatElevation((min + max) / 2, field) },
        { y: usableBottom, label: formatElevation(min, field) },
      ];
    }
    return generateFixedIntervalTicks(min, max, pickTickInterval(max - min), usableTop, usableBottom);
  }, [sharedBounds, field]);

  return (
    <div className="w-full">
      <div className="flex gap-1.5">
        <div className="relative w-9 shrink-0 mt-5" style={{ height: CHART_HEIGHT }}>
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
        <div className="flex-1 min-w-0">
          <div
            ref={scrollRef}
            className="overflow-x-auto snap-x snap-mandatory flex scrollbar-hide"
          >
            {dates.map(date => {
              const data = dayDataMap[date.dateStr];
              const loading = !data;
              return (
                <div key={date.dateStr} className="snap-start shrink-0 w-full">
                  <p className="text-xs font-medium text-muted-foreground text-center mb-1">{date.label}</p>
                  <DayPanel
                    hourlyData={data}
                    field={field}
                    unitLabel={unitLabel}
                    normalLevel={normalLevel}
                    overlayHours={overlayHours}
                    sharedBounds={sharedBounds}
                    isToday={date.isToday}
                    nowHour={date.isToday ? new Date().getHours() + new Date().getMinutes() / 60 : null}
                    loading={loading}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1 pl-10">
        {normalLevel != null && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600 whitespace-nowrap">
            <span className="inline-block w-3 border-t border-dashed border-green-500" />
            Normal level ({normalLevel.toFixed(2)}{unitLabel ? ` ${unitLabel}` : ''})
          </span>
        )}
        {hasOverlay && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 whitespace-nowrap">
            <span className="inline-block w-3 border-t border-red-700" />
            Historical
          </span>
        )}
        <span className="text-[11px] text-muted-foreground ml-auto">← Swipe to pan</span>
      </div>
    </div>
  );
}