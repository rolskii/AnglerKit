import { useState, useRef, useEffect, useCallback } from 'react';

const SAVED_KEY = 'anglerkit_radio_saved';
const RADIO_API = 'https://de1.api.radio-browser.info/json';

// Location tag → search term used against the Radio Browser API.
export const LOCATION_TAGS = [
  { label: 'Toronto', q: 'toronto' },
  { label: 'New York', q: 'new york' },
  { label: 'London', q: 'london' },
  { label: 'Paris', q: 'paris' },
  { label: 'Tokyo', q: 'tokyo' },
  { label: 'Los Angeles', q: 'los angeles' },
];

const normalize = (s) => ({
  id: s.stationuuid,
  name: (s.name || 'Unknown').trim(),
  location: [s.state, s.country].filter(Boolean).join(', '),
  url: s.url_resolved || s.url,
  favicon: s.favicon || '',
  bitrate: s.bitrate || 0,
  codec: s.codec || '',
  votes: s.votes || 0,
});

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Encapsulates a single shared <audio> element plus radio state.
 * Streams are fetched live from the Radio Browser public API.
 */
export function useRadioPlayer() {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(loadSaved);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeQuery, setActiveQuery] = useState('');

  // Create the audio element once.
  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    a.crossOrigin = 'anonymous';
    audioRef.current = a;
    const onPlaying = () => { setPlaying(true); setLoading(false); setError(null); };
    const onPause = () => setPlaying(false);
    const onErr = () => { setLoading(false); setPlaying(false); setError('Unable to play this stream.'); };
    const onWaiting = () => setLoading(true);
    a.addEventListener('playing', onPlaying);
    a.addEventListener('pause', onPause);
    a.addEventListener('error', onErr);
    a.addEventListener('waiting', onWaiting);
    return () => {
      a.pause();
      a.removeAttribute('src');
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('error', onErr);
      a.removeEventListener('waiting', onWaiting);
    };
  }, []);

  // Keep volume in sync.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Persist saved stations.
  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch (e) {}
  }, [saved]);

  const play = useCallback((station) => {
    const a = audioRef.current;
    if (!a || !station?.url) return;
    setCurrent(station);
    setLoading(true);
    setError(null);
    a.src = station.url;
    a.volume = muted ? 0 : volume;
    a.play().catch(() => {
      setLoading(false);
      setError('Unable to play this stream.');
    });
  }, [volume, muted]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) { a.play().catch(() => setError('Unable to play this stream.')); }
    else a.pause();
  }, [current]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.removeAttribute('src');
    setCurrent(null);
    setPlaying(false);
    setLoading(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const isSaved = useCallback((station) => station?.id ? saved.some((s) => s.id === station.id) : false, [saved]);

  const toggleSave = useCallback((station) => {
    if (!station?.id) return;
    setSaved((prev) => prev.some((s) => s.id === station.id)
      ? prev.filter((s) => s.id !== station.id)
      : [...prev, station]);
  }, []);

  const search = useCallback(async (query) => {
    const term = (query || '').trim();
    if (!term) return;
    setSearching(true);
    setActiveQuery(term);
    try {
      const res = await fetch(`${RADIO_API}/stations/byname/${encodeURIComponent(term)}?limit=40&order=votes&reverse=true&hidebroken=true`);
      const data = await res.json();
      const norm = data
        .map(normalize)
        .filter((s) => s.url && /^https?:\/\//.test(s.url));
      setResults(norm);
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const searchByTag = useCallback(async (q) => {
    if (!q) return;
    setSearching(true);
    setActiveQuery(q);
    try {
      const res = await fetch(`${RADIO_API}/stations/byname/${encodeURIComponent(q)}?limit=40&order=votes&reverse=true&hidebroken=true`);
      const data = await res.json();
      const norm = data.map(normalize).filter((s) => s.url && /^https?:\/\//.test(s.url));
      setResults(norm);
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Load popular stations the first time the panel opens.
  const loadDefaults = useCallback(async () => {
    setSearching(true);
    setActiveQuery('');
    try {
      const res = await fetch(`${RADIO_API}/stations/topvote/30`);
      const data = await res.json();
      const norm = data
        .map(normalize)
        .filter((s) => s.url && s.url.startsWith('https://'));
      setResults(norm);
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  return {
    current, playing, loading, error, volume, muted, saved, results, searching, activeQuery,
    play, toggle, stop, toggleMute, setVolume,
    isSaved, toggleSave, search, searchByTag, loadDefaults,
  };
}