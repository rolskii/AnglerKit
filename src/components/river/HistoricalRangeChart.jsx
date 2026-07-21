import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { buildSmoothPath, generateFixedIntervalTicks } from '@/lib/chartUtils';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHART_HEIGHT = 80;
const CHART_WIDTH = 720;

const RANGES = [
  { key: '24h', label: '24H' },
  { key: '2d', label: '2D' },
  { key: '7d', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '1y', label: '1Y' },
];

const RANGE_AGO_LABELS = {
  '24h': 'This time yesterday',
  '2d': '2 days ago',
  '7d': '1 week ago',
  '1m': '1 month ago',
  '3m': '3 months ago',
  '6m': '6 months ago',
  '1y': '1 year ago',
};

const MAJOR_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

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

const FIXED_TICKS = MAJOR_HOURS.map(h => ({
  pct: (h / 24) * 100,
  label: labelForHour(h),
}));

export default function HistoricalRangeChart({ stationId, stationName, field = 'level', unitLabel, currentValue, normalLevel }) {
  const [range, setRange] = useState('24h');
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
          tzOffset: new Date().getTimezoneOffset(),
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

    // Bucket the 5-minute realtime readings by local hour (0–23), averaging
    // all readings within each hour. This produces ~24 clean data points that
    // align with the 12am→12am axis labels, instead of plotting 288 raw
    // points that create visual artifacts.
    const buckets = new Array(24).fill(null);
    data.time.forEach((t, i) => {
      const v = values[i];
      if (v == null) return;
      const h = new Date(t).getHours();
      if (buckets[h] == null) buckets[h] = { sum: 0, count: 0 };
      buckets[h].sum += v;
      buckets[h].count++;
    });
    const known = [];
    buckets.forEach((b, h) => {
      if (b == null) return;
      known.push({ v: b.sum / b.count, hour: h });
    });
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

    // If only a single hour has data (daily-mean fallback for older
    // ranges), render as a flat line spanning the full 12am→12am axis.
    let plotKnown = known;
    if (known.length === 1) {
      const v = known[0].v;
      plotKnown = [{ v, hour: 0 }, { v, hour: 24 }];
    }

    const points = plotKnown.map((p) => ({
      x: (p.hour / 24) * CHART_WIDTH,
      y: usableBottom - ((p.v - min) / range_) * usableHeight,
    }));
    const pathD = buildSmoothPath(points);
    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`
      : '';

    const yTicks = field === 'discharge'
      ? [
          { y: usableTop, label: formatValue(max, field) },
          { y: (usableTop + usableBottom) / 2, label: formatValue((max + min) / 2, field) },
          { y: usableBottom, label: formatValue(min, field) },
        ]
      : generateFixedIntervalTicks(min, max, 0.05, usableTop, usableBottom);

    // Find the hour bucket closest to "this time" for the comparison text.
    const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
    const closest = known.reduce((best, p) =>
      Math.abs(p.hour - nowHour) < Math.abs(best.hour - nowHour) ? p : best, known[0]);

    return { pathD, areaD, ticks: FIXED_TICKS, yTicks, normalY, oldest: closest.v };
  }, [data, field, normalLevel]);

  const comparison = useMemo(() => {
    if (chart?.oldest == null || currentValue == null) return null;
    const diff = currentValue - chart.oldest;
    return { oldVal: chart.oldest, diff, label: RANGE_AGO_LABELS[range] || 'Earlier' };
  }, [chart?.oldest, currentValue, range]);

  return (
    <div className="space-y-3">
      {/* Range buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        {RANGES.map(r => (
          <Button
            key={r.key}
            size="sm"
            variant={range === r.key ? 'default' : 'outline'}
            className="h-7 px-2.5 text-xs"
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

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
              <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" style={{ height: CHART_HEIGHT, overflow: 'hidden' }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {chart.normalY != null && (
                  <line x1="0" y1={chart.normalY} x2={CHART_WIDTH} y2={chart.normalY} stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5 3" />
                )}
                {chart.areaD && <path d={chart.areaD} fill="url(#historicalGradient)" stroke="none" />}
                {chart.pathD && <path d={chart.pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />}
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