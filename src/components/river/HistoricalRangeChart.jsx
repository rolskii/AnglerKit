import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { buildSmoothPath, generateFixedIntervalTicks } from '@/lib/chartUtils';
import { Loader2 } from 'lucide-react';

const CHART_HEIGHT = 80;
const CHART_WIDTH = 720;

function formatValue(v, field) {
  if (v == null || isNaN(v)) return '—';
  return field === 'discharge' ? v.toFixed(1) : v.toFixed(2);
}

function labelForHour(h) {
  const hh = h % 24;
  if (hh === 0) return '12am';
  if (hh === 12) return '12pm';
  return hh > 12 ? `${hh - 12}pm` : `${hh}am`;
}

export default function HistoricalRangeChart({ stationId, stationName, field = 'level', unitLabel, currentValue, normalLevel }) {
  const range = '24h';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke('hydrometric', {
          stationId,
          stationName,
          historicalRange: range,
        });
        if (!cancelled) setData(res.data.historical);
      } catch (e) {
        if (!cancelled) setError('Could not load historical data for this range.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [stationId, stationName, range]);

  const chart = useMemo(() => {
    if (!data?.time?.length) return null;
    const values = data[field] || [];
    const times = data.time.map(t => new Date(t));
    const known = values.map((v, i) => ({ v, t: times[i] })).filter(p => p.v != null);
    if (known.length === 0) return null;
    let min = Math.min(...known.map(p => p.v));
    let max = Math.max(...known.map(p => p.v));
    if (normalLevel != null) {
      min = Math.min(min, normalLevel);
      max = Math.max(max, normalLevel);
    }
    if (field === 'level') {
      max = Math.floor(max / 0.05) * 0.05 + 0.05;
    }
    const range_ = max - min || 1;
    const usableTop = CHART_HEIGHT * 0.08;
    const usableBottom = CHART_HEIGHT * 0.92;
    const usableHeight = usableBottom - usableTop;
    const normalY = normalLevel != null ? usableBottom - ((normalLevel - min) / range_) * usableHeight : null;

    // Position data points by time fraction (not index) so ticks line up
    // with actual clock hours, matching the top chart's HourAxis.
    const startTime = known[0].t.getTime();
    const endTime = known[known.length - 1].t.getTime();
    const totalMs = endTime - startTime || 1;

    const points = known.map((p) => ({
      x: ((p.t.getTime() - startTime) / totalMs) * CHART_WIDTH,
      y: usableBottom - ((p.v - min) / range_) * usableHeight,
    }));
    const pathD = buildSmoothPath(points);
    const areaD = `${pathD} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

    // Fixed 3-hour interval ticks positioned by time fraction, matching
    // the Water Level (Today/Yesterday) chart's HourAxis above.
    const firstTickDate = new Date(startTime);
    firstTickDate.setMinutes(0, 0, 0);
    const firstHourMod = firstTickDate.getHours() % 3;
    if (firstHourMod !== 0) firstTickDate.setHours(firstTickDate.getHours() + (3 - firstHourMod));
    const ticks = [];
    for (let t = firstTickDate.getTime(); t <= endTime; t += 3 * 3600000) {
      const pct = ((t - startTime) / totalMs) * 100;
      if (pct >= -2 && pct <= 102) {
        ticks.push({ pct, label: labelForHour(new Date(t).getHours()) });
      }
    }

    const yTicks = field === 'discharge'
      ? [
          { y: usableTop, label: formatValue(max, field) },
          { y: (usableTop + usableBottom) / 2, label: formatValue((max + min) / 2, field) },
          { y: usableBottom, label: formatValue(min, field) },
        ]
      : generateFixedIntervalTicks(min, max, 0.05, usableTop, usableBottom);

    return { pathD, areaD, ticks, yTicks, normalY, oldest: known[0] };
  }, [data, field, normalLevel]);

  const comparison = useMemo(() => {
    if (!chart?.oldest || currentValue == null) return null;
    const oldVal = chart.oldest.v;
    if (oldVal == null) return null;
    const diff = currentValue - oldVal;
    return { oldVal, diff, label: 'This time yesterday' };
  }, [chart?.oldest, currentValue]);

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center gap-2 py-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-muted-foreground py-1.5">{error}</p>
      )}

      {!loading && !error && chart && (
        <div className="space-y-1.5">
          {comparison && (
            <p className="text-xs text-foreground leading-snug">
              {comparison.label}: <span className="font-medium">{formatValue(comparison.oldVal, field)}{unitLabel ? ` ${unitLabel}` : ''}</span>
              {' '}vs now <span className="font-medium">{formatValue(currentValue, field)}{unitLabel ? ` ${unitLabel}` : ''}</span>{' '}
              <span className={comparison.diff > 0 ? 'text-blue-600' : comparison.diff < 0 ? 'text-amber-600' : 'text-muted-foreground'}>
                ({comparison.diff > 0 ? '+' : ''}{formatValue(comparison.diff, field)}{unitLabel ? ` ${unitLabel}` : ''})
              </span>
            </p>
          )}
          <div className="flex items-stretch gap-1.5">
            <div className="relative w-9 shrink-0" style={{ height: CHART_HEIGHT }}>
              {chart.yTicks.map((tick, i) => (
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
              {chart.normalY != null && (
                <span className="absolute right-1 top-1 z-10 inline-flex items-center gap-1 text-[11px] font-medium text-green-600 bg-background/80 px-1 rounded whitespace-nowrap">
                  <span className="inline-block w-3 border-t border-dashed border-green-500" />
                  Normal level
                </span>
              )}
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" style={{ height: CHART_HEIGHT }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {chart.normalY != null && (
                  <line x1="0" y1={chart.normalY} x2={CHART_WIDTH} y2={chart.normalY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 3" />
                )}
                <path d={chart.areaD} fill="url(#historicalGradient)" stroke="none" />
                <path d={chart.pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="relative h-6 mt-1">
                {chart.ticks.map((tick, i) => (
                  <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${tick.pct}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-px h-1.5 bg-muted-foreground/50" />
                    <span className="text-[11px] mt-0.5 whitespace-nowrap text-muted-foreground">{tick.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && !chart && (
        <p className="text-xs text-muted-foreground py-1.5">No data available for this range.</p>
      )}
    </div>
  );
}