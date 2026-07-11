import React from 'react';

/**
 * Colorful weather icon component.
 * Renders detailed multi-color SVG glyphs based on WMO weather codes.
 * @param {number} code - WMO weather code
 * @param {boolean} isNight - whether to show night variants (moon instead of sun)
 * @param {string} className - size/positioning classes (e.g. "w-7 h-7")
 * @param {boolean} animated - enable weather animations (rain, snow, lightning, etc.)
 */
export default function WeatherGlyph({ code, isNight = false, className = 'w-7 h-7', darkOutline = false, animated = false }) {
  // Determine icon type from code
  const isClear = code === 0 || code === 1;
  const isPartlyCloudy = code === 2;
  const isCloudy = code === 3;
  const isFog = code === 45 || code === 48;
  const isDrizzle = code >= 51 && code <= 55;
  const isRain = code === 61 || code === 63 || code === 65 || code === 80 || code === 81 || code === 82;
  const isSnow = code === 71 || code === 73 || code === 75 || code === 85 || code === 86;
  const isThunder = code >= 95 && code <= 99;

  // Color palette
  const sunFill = '#FBBF24'; // amber-400
  const sunStroke = darkOutline ? '#B45309' : '#F59E0B'; // amber-800 or amber-500
  const moonFill = '#F1F5F9'; // slate-100 (bright silver lit side)
  const moonStroke = darkOutline ? '#334155' : '#64748B'; // slate-700 or slate-500
  const cloudLight = '#F1F5F9'; // slate-100
  const cloudMid = darkOutline ? '#64748B' : '#CBD5E1'; // slate-500 or slate-300
  const cloudDark = darkOutline ? '#475569' : '#94A3B8'; // slate-600 or slate-400
  const cloudStorm = darkOutline ? '#475569' : '#64748B'; // slate-600 or slate-500
  const rainColor = '#3B82F6'; // blue-500
  const rainLight = '#60A5FA'; // blue-400
  const snowColor = '#E0F2FE'; // sky-100
  const lightning = '#FACC15'; // yellow-400
  const fogColor = '#94A3B8'; // slate-400

  // Animation class helpers
  const anim = (cls) => (animated ? cls : '');

  // Reusable SVG sub-shapes
  const SunShape = ({ cx = 32, cy = 28, r = 11 }) => (
    <g>
      {/* Rays — rotate when animated */}
      <g className={anim('wx-anim-rays')} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45) * Math.PI / 180;
          const x1 = cx + Math.cos(angle) * (r + 3);
          const y1 = cy + Math.sin(angle) * (r + 3);
          const x2 = cx + Math.cos(angle) * (r + 7);
          const y2 = cy + Math.sin(angle) * (r + 7);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={sunStroke} strokeWidth="2.5" strokeLinecap="round" />
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={sunFill} stroke={sunStroke} strokeWidth={darkOutline ? 2.5 : 1.5}
        className={anim('wx-anim-sun')} style={{ transformOrigin: `${cx}px ${cy}px` }} />
    </g>
  );

  const MoonShape = ({ cx = 32, cy = 26, r = 11 }) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={moonFill} stroke={moonStroke} strokeWidth={darkOutline ? 2 : 1}
        className={anim('wx-anim-moon')} style={{ transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx + r * 0.45} cy={cy - r * 0.15} r={r} fill={moonStroke} />
    </g>
  );

  const CloudShape = ({ cx = 34, cy = 38, scale = 1, fill = cloudLight, stroke = cloudMid }) => {
    const s = scale;
    return (
      <g className={anim('wx-anim-cloud')} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <g transform={`translate(${cx - 34 * s}, ${cy - 38 * s}) scale(${s})`}>
          <path
            d="M 22 44 Q 14 44 14 36 Q 14 28 22 28 Q 24 21 32 21 Q 40 21 43 28 Q 54 27 54 36 Q 54 44 46 44 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={darkOutline ? 2.5 : 1.5}
            strokeLinejoin="round"
          />
        </g>
      </g>
    );
  };

  const rainAnimClasses = ['wx-anim-rain-1', 'wx-anim-rain-2', 'wx-anim-rain-3'];

  const RainDrops = ({ count = 3 }) => {
    const positions = [
      { x: 24, y: 50 },
      { x: 34, y: 52 },
      { x: 44, y: 50 },
    ];
    return (
      <g>
        {positions.slice(0, count).map((p, i) => (
          <path
            key={i}
            d={`M ${p.x} ${p.y} Q ${p.x - 2} ${p.y + 5} ${p.x} ${p.y + 8} Q ${p.x + 2} ${p.y + 5} ${p.x} ${p.y} Z`}
            fill={i % 2 === 0 ? rainColor : rainLight}
            className={anim(rainAnimClasses[i])}
            style={{ transformOrigin: `${p.x}px ${p.y + 4}px` }}
          />
        ))}
      </g>
    );
  };

  const snowAnimClasses = ['wx-anim-snow-1', 'wx-anim-snow-2', 'wx-anim-snow-3'];

  const SnowFlakes = ({ count = 3 }) => {
    const positions = [
      { x: 24, y: 50 },
      { x: 34, y: 53 },
      { x: 44, y: 50 },
    ];
    return (
      <g>
        {positions.slice(0, count).map((p, i) => (
          <g key={i} stroke={snowColor} strokeWidth="1.8" strokeLinecap="round"
            className={anim(snowAnimClasses[i])}
            style={{ transformOrigin: `${p.x}px ${p.y + 3.5}px` }}>
            <line x1={p.x} y1={p.y} x2={p.x} y2={p.y + 7} />
            <line x1={p.x - 3} y1={p.y + 3.5} x2={p.x + 3} y2={p.y + 3.5} />
            <line x1={p.x - 2.5} y1={p.y + 1} x2={p.x + 2.5} y2={p.y + 6} />
            <line x1={p.x + 2.5} y1={p.y + 1} x2={p.x - 2.5} y2={p.y + 6} />
          </g>
        ))}
      </g>
    );
  };

  const Lightning = () => (
    <path
      d="M 36 46 L 30 56 L 34 56 L 30 66 L 40 53 L 35 53 L 39 46 Z"
      fill={lightning}
      stroke="#EAB308"
      strokeWidth="1"
      strokeLinejoin="round"
      className={anim('wx-anim-lightning')}
      style={{ transformOrigin: '35px 56px' }}
    />
  );

  const fogAnimClasses = ['wx-anim-fog-1', 'wx-anim-fog-2', 'wx-anim-fog-3'];

  const FogLines = () => (
    <g stroke={fogColor} strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="50" x2="50" y2="50"
        className={anim(fogAnimClasses[0])} style={{ transformOrigin: '34px 50px' }} />
      <line x1="22" y1="55" x2="46" y2="55"
        className={anim(fogAnimClasses[1])} style={{ transformOrigin: '34px 55px' }} />
      <line x1="18" y1="60" x2="42" y2="60"
        className={anim(fogAnimClasses[2])} style={{ transformOrigin: '30px 60px' }} />
    </g>
  );

  // Render based on condition
  let content = null;

  if (isClear) {
    content = isNight ? <MoonShape /> : <SunShape />;
  } else if (isPartlyCloudy) {
    content = (
      <g>
        {isNight ? <MoonShape cx={26} cy={24} r={9} /> : <SunShape cx={26} cy={24} r={9} />}
        <CloudShape cx={38} cy={36} scale={0.85} fill={cloudLight} stroke={cloudMid} />
      </g>
    );
  } else if (isCloudy) {
    content = (
      <g>
        <CloudShape cx={28} cy={30} scale={0.7} fill={cloudMid} stroke={cloudDark} />
        <CloudShape cx={38} cy={38} scale={1} fill={cloudLight} stroke={cloudMid} />
      </g>
    );
  } else if (isFog) {
    content = (
      <g>
        <CloudShape cx={34} cy={32} scale={0.9} fill={cloudLight} stroke={cloudMid} />
        <FogLines />
      </g>
    );
  } else if (isDrizzle) {
    content = (
      <g>
        <CloudShape cx={34} cy={34} scale={1} fill={cloudLight} stroke={cloudMid} />
        <RainDrops count={2} />
      </g>
    );
  } else if (isRain) {
    content = (
      <g>
        <CloudShape cx={34} cy={32} scale={1} fill={cloudMid} stroke={cloudDark} />
        <RainDrops count={3} />
      </g>
    );
  } else if (isSnow) {
    content = (
      <g>
        <CloudShape cx={34} cy={32} scale={1} fill={cloudLight} stroke={cloudMid} />
        <SnowFlakes count={3} />
      </g>
    );
  } else if (isThunder) {
    content = (
      <g>
        <CloudShape cx={34} cy={30} scale={1} fill={cloudStorm} stroke="#475569" />
        <Lightning />
        <RainDrops count={1} />
      </g>
    );
  } else {
    // fallback: cloudy
    content = <CloudShape cx={34} cy={36} scale={1} fill={cloudLight} stroke={cloudMid} />;
  }

  return (
    <svg
      viewBox="0 0 64 72"
      width="100%"
      height="100%"
      className={className}
      style={{ maxWidth: '100%', maxHeight: '100%' }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}