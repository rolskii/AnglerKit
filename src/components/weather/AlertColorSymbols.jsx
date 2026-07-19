import React from 'react';

function AlertIcon({ color, className = 'w-5 h-5' }) {
  if (color === 'red') {
    return (
      <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 3 L22 21 L2 21 Z" fill="#E60000" stroke="#1a1a1a" strokeWidth="1" strokeLinejoin="round" />
        <rect x="11" y="9" width="2" height="6" fill="white" rx="1" />
        <rect x="11" y="17" width="2" height="2" fill="white" rx="1" />
      </svg>
    );
  }
  if (color === 'orange') {
    return (
      <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2 L22 12 L12 22 L2 12 Z" fill="#FF9900" stroke="#1a1a1a" strokeWidth="1" strokeLinejoin="round" />
        <rect x="11" y="7" width="2" height="7" fill="#1a1a1a" rx="1" />
        <rect x="11" y="16" width="2" height="2" fill="#1a1a1a" rx="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#FFFF00" stroke="#1a1a1a" strokeWidth="1" />
      <rect x="11" y="7" width="2" height="7" fill="#1a1a1a" rx="1" />
      <rect x="11" y="16" width="2" height="2" fill="#1a1a1a" rx="1" />
    </svg>
  );
}

const COLOR_STYLES = {
  red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', info: 'Very dangerous and possibly life-threatening weather will cause extreme damage and disruption' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', info: 'Severe weather is likely to cause significant damage, disruption, or health impacts' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', info: 'Hazardous weather may cause damage, disruption, or health impacts' },
};

export default function AlertColorSymbols({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  // Filter out persistent Air Quality statements — they linger regardless of actual conditions
  const filtered = alerts.filter(a => !/air\s*quality/i.test(a.description || ''));
  if (filtered.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {filtered.map((alert, i) => {
        const style = COLOR_STYLES[alert.color] || COLOR_STYLES.yellow;
        const cleanDesc = (alert.description || '').replace(
          /^(YELLOW|ORANGE|RED)\s+(WARNING|WATCH|ADVISORY|STATEMENT)\s*-\s*/i, ''
        );
        return (
          <div key={i} className={`flex items-start gap-2 p-2 rounded-lg border ${style.bg} ${style.border}`}>
            <AlertIcon color={alert.color} className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className={`text-xs font-semibold leading-tight ${style.text} block`}>
                {cleanDesc || alert.description}
              </span>
              <span className="text-xs leading-tight text-foreground/70 mt-1 block">
                {style.info}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}