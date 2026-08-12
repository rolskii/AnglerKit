import { useState, useRef, useEffect, useCallback } from 'react';

import { base44 } from '@/api/base44Client';

const SAVED_KEY = 'anglerkit_radio_saved';

// Browseable city tags. Radio Garden's /search handles place + station names,
// so each tag is simply the city name.
export const LOCATION_TAGS = [
  { label: 'Toronto', q: 'Toronto' },
  { label: 'New York', q: 'New York' },
  { label: 'London', q: 'London' },
  { label: 'Paris', q: 'Paris' },
  { label: 'Tokyo', q: 'Tokyo' },
  { label: 'Los Angeles', q: 'Los Angeles' },
];

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
 * Streams are played directly from Radio Garden's live listen endpoint.
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

  // Create the audio element once. No crossOrigin: cross-origin media plays
  // without CORS as long as we don't read the audio data.
  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch (e) {}
  }, [saved]);

  // Search Radio Garden via our backend proxy (avoids browser CORS).
  const runSearch = useCallback(async (query) => {
    const term = (query || '').trim();
    if (!term) return [];
    const res = await base44.functions.invoke('radiogarden', { query: term });
    return res?.data?.stations || [];
  }, []);

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
      setResults(await runSearch(term));
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [runSearch]);

  const searchByTag = useCallback(async (q) => {
    if (!q) return;
    setSearching(true);
    setActiveQuery(q);
    try {
      setResults(await runSearch(q));
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [runSearch]);

  // On first open, surface stations near the listener via Radio Garden's
  // geo endpoint, falling back to Toronto.
  const loadDefaults = useCallback(async () => {
    setSearching(true);
    setActiveQuery('');
    try {
      let query = 'Toronto';
      try {
        const geoRes = await base44.functions.invoke('radiogarden', { geo: true });
        if (geoRes?.data?.city) query = geoRes.data.city;
      } catch (e) {}
      setResults(await runSearch(query));
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [runSearch]);

  return {
    current, playing, loading, error, volume, muted, saved, results, searching, activeQuery,
    play, toggle, stop, toggleMute, setVolume,
    isSaved, toggleSave, search, searchByTag, loadDefaults,
  };
}