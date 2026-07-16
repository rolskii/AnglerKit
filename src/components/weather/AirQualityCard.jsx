import React from 'react';

// AQHI value → color (light blue at 1 → dark red at 10+)
const AQHI_COLORS = {
  1: '#7DD3FC',
  2: '#67E8F9',
  3: '#6EE7B7',
  4: '#BEF264',
  5: '#FDE047',
  6: '#FCD34D',
  7: '#FB923C',
  8: '#F87171',
  9: '#EF4444',
  10: '#DC2626',
  11: '#991B1B',
};

function getRiskCategory(value) {
  if (value <= 3) return { label: 'Low Risk', range: '1 – 3' };
  if (value <= 6) return { label: 'Moderate Risk', range: '4 – 6' };
  if (value <= 10) return { label: 'High Risk', range: '7 – 10' };
  return { label: 'Very High Risk', range: '10+' };
}

function getColorForValue(value) {
  if (value >= 11) return AQHI_COLORS[11];
  return AQHI_COLORS[Math.round(value)] || AQHI_COLORS[1];
}

export default function AirQualityCard({ airQuality }) {
  if (!airQuality || airQuality.value == null) return null;

  const value = airQuality.value;
  const risk = getRiskCategory(value);
  const currentColor = getColorForValue(value);

  return (
    <div className="bg-secondary/60 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Air Quality Health Index</p>
          <p className="text-lg font-bold leading-tight" style={{ color: currentColor }}>
            {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight">{risk.label}</p>
          <p className="text-xs text-muted-foreground leading-tight">{risk.range}</p>
        </div>
      </div>

      {/* Scale bar */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const isActive = Math.round(value) === n;
          return (
            <div
              key={n}
              className="flex-1 h-7 rounded flex items-center justify-center transition-all"
              style={{
                backgroundColor: AQHI_COLORS[n],
                opacity: isActive ? 1 : 0.4,
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <span className="text-[9px] font-bold" style={{ color: n <= 2 ? '#1a3a52' : n >= 6 ? '#fff' : '#1a1a1a' }}>
                {n}
              </span>
            </div>
          );
        })}
        {value > 10 && (
          <div
            className="flex-1 h-7 rounded flex items-center justify-center"
            style={{ backgroundColor: AQHI_COLORS[11] }}
          >
            <span className="text-[9px] font-bold text-white">+</span>
          </div>
        )}
      </div>

      {/* Category labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Low (1–3)</span>
        <span>Moderate (4–6)</span>
        <span>High (7–10)</span>
        <span>Very High (+)</span>
      </div>
    </div>
  );
}