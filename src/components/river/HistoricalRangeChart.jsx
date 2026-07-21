import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { buildSmoothPath } from '@/lib/chartUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';

const RANGES = [
  { key: '24h', label: '24H' },
  { key: '2d', label: '2D' },
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: 'custom', label: 'Custom' },
];

const RANGE_AGO_LABELS = {
  '24h': 'This time yesterday',
  '2d': '2 days ago',
  '1w': '1 week ago',
  '1m': '1 month ago',
  '3m': '3 months ago',
  '6m': '6 months ago',
  '1y': '1 year ago',
};

const CHART_HEIGHT = 160;
const CHART_WIDTH = 720;

function formatValue(v, field) {
  if (v == null || isNaN(v)) return '—';
  return field === 'discharge' ? v.toFixed(1) : v.toFixed(2);
}

function formatAxisLabel(date, spanDays) {
  if (spanDays <= 2.5) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
  }
  if (spanDays <= 60) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function HistoricalRangeChart({ stationId, stationName, field = 'level', unitLabel, currentValue }) {
  const [range, setRange] = useState('1w');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationId) return;
    if (range === 'custom' && (!customFrom || !customTo)) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await base44.functions.invoke('hydrometric', {
          stationId,
          stationName,
          historicalRange: range,
          startDate: range === 'custom' ? customFrom.toISOString() : undefined,
          endDate: range === 'custom' ? customTo.toISOString() : undefined,
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
  }, [stationId, stationName, range, customFrom, customTo]);

  const scrollRef = useRef(null);

  const chart = useMemo(() => {
    if (!data?.time?.length) return null;
    const values = data[field] || [];
    const times = data.time.map(t => new Date(t));
    const known = values.map((v, i) => ({ v, t: times[i] })).filter(p => p.v != null);
    if (known.length === 0) return null;
    const min = Math.min(...known.map(p => p.v));
    const max = Math.max(...known.map(p => p.v));
    const range_ = max - min || 1;
    const usableTop = CHART_HEIGHT * 0.08;
    const usableBottom = CHART_HEIGHT * 0.92;
    const usableHeight = usableBottom - usableTop;
    const n = known.length;
    // Render at a fixed pixel-per-point scale (not squeezed to fit the
    // screen) so longer ranges are wide enough to pan across — same idea
    // as the Hourly Fish Activity chart's swipeable day panels, but here
    // it's one continuous scrollable line rather than discrete pages.
    const renderWidth = Math.max(CHART_WIDTH, n * 4);
    const points = known.map((p, i) => ({
      x: n > 1 ? (i / (n - 1)) * renderWidth : renderWidth / 2,
      y: usableBottom - ((p.v - min) / range_) * usableHeight,
    }));
    const pathD = buildSmoothPath(points);
    const areaD = `${pathD} L ${points[points.length - 1].x} ${CHART_HEIGHT} L ${points[0].x} ${CHART_HEIGHT} Z`;

    const spanDays = (times[times.length - 1] - times[0]) / 86400000;
    const tickCount = Math.max(6, Math.round(renderWidth / 110));
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const idx = Math.round((i / (tickCount - 1)) * (n - 1));
      return { x: points[idx]?.x ?? 0, label: formatAxisLabel(known[idx].t, spanDays) };
    });

    // Y-axis elevation labels — top/middle/bottom of the plotted range so the
    // user can read approximate water level (or discharge) values off the chart.
    const mid = (max + min) / 2;
    const yTicks = [
      { y: usableTop, label: formatValue(max, field) },
      { y: (usableTop + usableBottom) / 2, label: formatValue(mid, field) },
      { y: usableBottom, label: formatValue(min, field) },
    ];

    return { pathD, areaD, ticks, yTicks, min, max, renderWidth, oldest: known[0] };
  }, [data, field]);

  // Compares the current live reading to the oldest point in the currently
  // selected range — i.e. "this time N ago" — so it's easy to see how today
  // stacks up against the same point in the past, not just eyeball the line.
  const comparison = useMemo(() => {
    if (!chart?.oldest || currentValue == null) return null;
    const oldVal = chart.oldest.v;
    if (oldVal == null) return null;
    const diff = currentValue - oldVal;
    const label = range === 'custom'
      ? `On ${chart.oldest.t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : (RANGE_AGO_LABELS[range] || 'Earlier in this range');
    return { oldVal, diff, label };
  }, [chart?.oldest, currentValue, range]);

  // Default to panned all the way to the right (most recent data) — the
  // user can then swipe/drag left to explore earlier points and back right
  // to return to "now", same feel as the other river/moon charts.
  useEffect(() => {
    if (scrollRef.current && chart?.renderWidth) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [chart?.renderWidth, data]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              range === r.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="flex gap-2 items-center text-sm">
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-2.5 py-1 rounded-lg bg-secondary text-xs">
                {customFrom ? customFrom.toLocaleDateString() : 'From'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="px-2.5 py-1 rounded-lg bg-secondary text-xs">
                {customTo ? customTo.toLocaleDateString() : 'To'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} />
            </PopoverContent>
          </Popover>
        </div>
      )}

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
                  className="absolute right-0 text-[9px] text-muted-foreground whitespace-nowrap"
                  style={{ top: `${(tick.y / CHART_HEIGHT) * 100}%`, transform: 'translateY(-50%)' }}
                >
                  {tick.label}
                </span>
              ))}
            </div>
            <div ref={scrollRef} className="flex-1 min-w-0 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: chart.renderWidth }}>
                <svg
                  viewBox={`0 0 ${chart.renderWidth} ${CHART_HEIGHT}`}
                  style={{ width: chart.renderWidth, height: CHART_HEIGHT, display: 'block' }}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <path d={chart.areaD} fill="url(#historicalGradient)" stroke="none" />
                  <path d={chart.pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div className="relative h-5 mt-1" style={{ width: chart.renderWidth }}>
                  {chart.ticks.map((tick, i) => (
                    <span
                      key={i}
                      className="absolute text-[9px] text-muted-foreground whitespace-nowrap"
                      style={{ left: tick.x, transform: 'translateX(-50%)' }}
                    >
                      {tick.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {unitLabel && (
            <p className="text-[9px] text-muted-foreground text-right pr-1">{unitLabel}</p>
          )}
        </div>
      )}

      {!loading && !error && !chart && (
        <p className="text-xs text-muted-foreground py-1.5">No data available for this range.</p>
      )}
    </div>
  );
}
