import React from 'react';

// Official AQHI color scale (matching Environment Canada reference)
const AQHI_COLORS = {
  1: '#00BFFF',  // Light Blue
  2: '#008CC9',  // Medium Blue
  3: '#005F99',  // Dark Blue
  4: '#FFFF00',  // Bright Yellow
  5: '#FFD700',  // Golden Yellow
  6: '#FF8C00',  // Orange
  7: '#FF6A6A',  // Light Red
  8: '#FF0000',  // Medium Red
  9: '#C80000',  // Dark Red
  10: '#8B0000', // Deep Dark Red
  11: '#4A0000', // Very Dark Maroon (+)
};

function getRiskCategory(value) {
  if (value <= 3) return { label: 'Low risk', range: '1 - 3' };
  if (value <= 6) return { label: 'Moderate risk', range: '4 - 6' };
  if (value <= 10) return { label: 'High risk', range: '7 - 10' };
  return { label: 'Very high risk', range: '+' };
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
      {/* Header with current value + risk */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Air Quality Health Index</p>
          <p className="text-2xl font-bold leading-tight" style={{ color: currentColor }}>
            {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight">{risk.label}</p>
          <p className="text-xs text-muted-foreground leading-tight">({risk.range})</p>
        </div>
      </div>

      {/* Color scale bar — 1 through 10 and + */}
      <div className="flex items-stretch gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const isActive = Math.round(value) === n;
          return (
            <div
              key={n}
              className="flex-1 h-8 rounded flex items-center justify-center transition-all"
              style={{
                backgroundColor: AQHI_COLORS[n],
                opacity: isActive ? 1 : 0.35,
                transform: isActive ? 'scale(1.12)' : 'scale(1)',
                boxShadow: isActive ? `0 0 6px ${AQHI_COLORS[n]}` : 'none',
              }}
            >
              <span className="text-xs font-bold" style={{ color: n <= 3 ? '#fff' : n <= 6 ? '#1a1a1a' : '#fff' }}>
                {n}
              </span>
            </div>
          );
        })}
        <div
          className="flex-1 h-8 rounded flex items-center justify-center transition-all"
          style={{
            backgroundColor: AQHI_COLORS[11],
            opacity: value > 10 ? 1 : 0.35,
            transform: value > 10 ? 'scale(1.12)' : 'scale(1)',
            boxShadow: value > 10 ? `0 0 6px ${AQHI_COLORS[11]}` : 'none',
          }}
        >
          <span className="text-xs font-bold text-white">+</span>
        </div>
      </div>

      {/* Risk category labels under scale */}
      <div className="flex text-[10px] font-medium text-muted-foreground">
        <span className="flex-[3] text-center">Low risk (1 - 3)</span>
        <span className="flex-[3] text-center">Moderate risk (4 - 6)</span>
        <span className="flex-[4] text-center">High risk (7 - 10)</span>
        <span className="flex-[1] text-center">+</span>
      </div>
    </div>
  );
}