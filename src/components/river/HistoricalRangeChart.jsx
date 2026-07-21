import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

function formatValue(v, field) {
  if (v == null || isNaN(v)) return '—';
  return field === 'discharge' ? v.toFixed(1) : v.toFixed(2);
}

export default function HistoricalRangeChart({ stationId, stationName, field = 'level', unitLabel, currentValue, onDataChange }) {
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
        if (!cancelled) {
          setData(res.data.historical);
          onDataChange?.(res.data.historical);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Could not load historical data for this range.');
          onDataChange?.(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [stationId, stationName, range, onDataChange]);

  // Find the hour bucket closest to "this time" for the comparison text.
  const oldestVal = (() => {
    if (!data?.time?.length) return null;
    const values = data[field] || [];
    const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
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
    const closest = known.reduce((best, p) =>
      Math.abs(p.hour - nowHour) < Math.abs(best.hour - nowHour) ? p : best, known[0]);
    return closest.v;
  })();

  const comparison = oldestVal != null && currentValue != null
    ? { oldVal: oldestVal, diff: currentValue - oldestVal, label: RANGE_AGO_LABELS[range] || 'Earlier' }
    : null;

  return (
    <div className="space-y-1.5">
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
        <div className="flex items-center gap-2 py-0.5">
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      )}

      {!loading && error && (
        <p className="text-xs text-muted-foreground">{error}</p>
      )}

      {!loading && !error && comparison && (
        <p className="text-xs text-foreground leading-snug">
          {comparison.label}: <span className="font-medium">{formatValue(comparison.oldVal, field)}{unitLabel ? ` ${unitLabel}` : ''}</span>
          {' '}vs now <span className="font-medium">{formatValue(currentValue, field)}{unitLabel ? ` ${unitLabel}` : ''}</span>{' '}
          <span className={comparison.diff > 0 ? 'text-blue-600' : comparison.diff < 0 ? 'text-amber-600' : 'text-muted-foreground'}>
            ({comparison.diff > 0 ? '+' : ''}{formatValue(comparison.diff, field)}{unitLabel ? ` ${unitLabel}` : ''})
          </span>
        </p>
      )}

      {!loading && !error && !comparison && (
        <p className="text-xs text-muted-foreground">No data available for this range.</p>
      )}
    </div>
  );
}