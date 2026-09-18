import { useState, useEffect } from 'react';

const KEY = 'show_control_labels';
const EVENT = 'controlLabelsChanged';



export const getControlLabelsEnabled = () => {
  try { return localStorage.getItem(KEY) !== 'false'; } catch { return true; }
};

export const setControlLabelsEnabled = (enabled) => {
  try { localStorage.setItem(KEY, String(!!enabled)); } catch (e) {}
  window.dispatchEvent(new Event(EVENT));
};

// Live value of the "Help Labels" setting — reacts to Settings changes
export default function useControlLabels() {
  const [enabled, setEnabled] = useState(getControlLabelsEnabled);
  useEffect(() => {
    const handler = () => setEnabled(getControlLabelsEnabled());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return enabled;
}

// Labels show whenever the "Help Labels" setting is on — no expiry
export function useControlHints() {
  return useControlLabels();
}