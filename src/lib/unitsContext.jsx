import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const UnitsContext = createContext(null);

const M_TO_FT = 3.28084;
const M3S_TO_CFS = 35.3147;
const IN_TO_CM = 2.54;
const LB_TO_KG = 0.453592;

export function UnitsProvider({ children }) {
  const [system, setSystem] = useState(() => {
    const stored = localStorage.getItem('unitSystem');
    if (stored) return stored;
    const wtu = localStorage.getItem('weatherTempUnit');
    if (wtu === 'fahrenheit') return 'imperial';
    if (wtu === 'celsius') return 'metric';
    return 'metric';
  });

  const setUnitSystem = useCallback((s) => {
    setSystem(s);
    localStorage.setItem('unitSystem', s);
    const wtu = s === 'metric' ? 'celsius' : 'fahrenheit';
    localStorage.setItem('weatherTempUnit', wtu);
    window.dispatchEvent(new Event('weatherTempUnitChanged'));
  }, []);

  const isMetric = system === 'metric';

  const value = useMemo(() => ({
    system,
    setUnitSystem,
    isMetric,

    // Catches: stored in inches / pounds (imperial)
    formatLength: (inches) => {
      if (inches == null) return null;
      return isMetric ? `${(inches * IN_TO_CM).toFixed(1)} cm` : `${inches} in`;
    },
    formatWeight: (lbs) => {
      if (lbs == null) return null;
      return isMetric ? `${(lbs * LB_TO_KG).toFixed(1)} kg` : `${lbs} lb`;
    },

    // River: stored in meters / m³/s (metric)
    formatLevel: (m) => {
      if (m == null) return null;
      return isMetric ? `${m.toFixed(2)} m` : `${(m * M_TO_FT).toFixed(2)} ft`;
    },
    formatDischarge: (m3s) => {
      if (m3s == null) return null;
      return isMetric ? `${m3s.toFixed(1)} m³/s` : `${(m3s * M3S_TO_CFS).toFixed(1)} cfs`;
    },

    // Chart helpers — convert raw metric values to the display system
    levelUnitLabel: isMetric ? 'm' : 'ft',
    convertLevelVal: (m) => isMetric ? m : (m != null ? m * M_TO_FT : null),
    convertDischargeVal: (m3s) => isMetric ? m3s : (m3s != null ? m3s * M3S_TO_CFS : null),

    // Weather sync
    weatherUnit: isMetric ? 'celsius' : 'fahrenheit',
    tempLabel: isMetric ? '°C' : '°F',
  }), [system, setUnitSystem, isMetric]);

  return (
    <UnitsContext.Provider value={value}>
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider');
  return ctx;
}