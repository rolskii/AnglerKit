import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Waves, MapPin, ChevronDown, TrendingUp, TrendingDown, Minus,
  Droplets, Gauge, StickyNote, Plus, AlertTriangle, Info, CheckCircle2, Trash2, Pen,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getSharedLocation, setSharedLocation } from '@/lib/sharedLocation';
import RiverStationMapPicker from '@/components/river/RiverStationMapPicker';
import RiverLevelChart from '@/components/river/RiverLevelChart';
import HistoricalRangeChart from '@/components/river/HistoricalRangeChart';
import PullToRefresh from '@/components/PullToRefresh';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

function TrendIndicator({ trend }) {
  if (!trend) return null;
  const Icon = trend.direction === 'rising' ? TrendingUp : trend.direction === 'falling' ? TrendingDown : Minus;
  const tone = trend.direction === 'rising' ? 'text-blue-600' : trend.direction === 'falling' ? 'text-amber-600' : 'text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${tone}`}>
      <Icon className="w-3.5 h-3.5" />
      {trend.direction !== 'steady' ? `${Math.abs(Math.round(trend.changePct))}%` : 'steady'}
    </span>
  );
}

// Turns the raw "percentile vs. historical normal" + trend numbers into a
// plain-language sentence, e.g. "Currently lower than normal, but rising fast."
function buildNormalSummary(normal, trend) {
  if (!normal) return null;
  const pct = normal.percentile;
  const isBelow = pct != null && pct <= 30;
  const isAbove = pct != null && pct >= 70;

  // Always state a below/above direction, even inside the "near normal"
  // middle band — the backend's plain "near normal" label alone doesn't say
  // which side of the median the reading is on, which is what's confusing.
  let levelPhrase = normal.label;
  if (pct != null) {
    if (pct >= 90) levelPhrase = 'much higher than normal';
    else if (pct >= 70) levelPhrase = 'higher than normal';
    else if (pct <= 10) levelPhrase = 'much lower than normal';
    else if (pct <= 30) levelPhrase = 'lower than normal';
    else if (pct > 50) levelPhrase = 'slightly above normal';
    else if (pct < 50) levelPhrase = 'slightly below normal';
    else levelPhrase = 'right at normal';
  }

  const direction = trend?.direction;
  const changePct = trend?.changePct != null ? Math.abs(trend.changePct) : 0;
  const fast = changePct >= 8;

  let trendPhrase = 'holding steady';
  if (direction === 'rising') trendPhrase = fast ? 'rising fast' : 'rising';
  else if (direction === 'falling') trendPhrase = fast ? 'falling fast' : 'falling';

  // "but" when the trend is moving back toward normal (below-and-rising,
  // above-and-falling); "and" when it's reinforcing the current extreme,
  // or when levels are already near normal.
  const conjunction = (isBelow && direction === 'rising') || (isAbove && direction === 'falling') ? 'but' : 'and';

  return `Currently ${levelPhrase}, ${conjunction} ${trendPhrase}.`;
}

function buildAdvisory(data) {
  if (!data?.trend || !data?.current) return null;
  const rising = data.trend.level?.direction === 'rising';
  const high = data.normal?.percentile != null && data.normal.percentile >= 80;
  const low = data.normal?.percentile != null && data.normal.percentile <= 20;
  if (rising && high) {
    return { icon: AlertTriangle, tone: 'text-red-600 bg-red-500/10', text: 'Water levels are rising and already higher than normal — use caution wading, and watch for increased turbidity.' };
  }
  if (rising) {
    return { icon: Info, tone: 'text-amber-600 bg-amber-500/10', text: 'Water levels are rising. Conditions may become more difficult through the day.' };
  }
  if (low) {
    return { icon: CheckCircle2, tone: 'text-green-600 bg-green-500/10', text: 'Water levels are lower than normal — good wading conditions, but fish may be more easily spooked in clearer, shallower water.' };
  }
  return null;
}

export default function RiverConditions() {
  const sharedInit = getSharedLocation();
  const [locationName, setLocationName] = useState(sharedInit.name);
  const [coords, setCoords] = useState(sharedInit.coords);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [historicalHourly, setHistoricalHourly] = useState(null);
  const [overlayLabel, setOverlayLabel] = useState('This time yesterday');


  const fetchConditions = useCallback(async (lat, lon) => {
    if (!lat || !lon) return;
    try {
      setLoading(true);
      setError(null);
      const res = await base44.functions.invoke('hydrometric', { lat, lon });
      if (res.data?.error) {
        setError(res.data.error);
        setData(null);
      } else {
        setData(res.data);
      }
    } catch (e) {
      setError('Could not load river conditions for this location.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch conditions for one exact, already-known station (from a river/
  // station-name search result, or a "Nearby Stations" row) rather than
  // searching for the nearest station to a lat/lon.
  const fetchConditionsForStation = useCallback(async (stationId, name) => {
    try {
      setLoading(true);
      setError(null);
      const res = await base44.functions.invoke('hydrometric', { stationId, stationName: name });
      if (res.data?.error) {
        setError(res.data.error);
        setData(null);
      } else {
        setData(res.data);
      }
    } catch (e) {
      setError('Could not load conditions for that station.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { refresh } = useAutoRefresh(() => fetchConditions(coords?.lat, coords?.lon), 15 * 60 * 1000);

  useEffect(() => {
    fetchConditions(coords.lat, coords.lon);
    // Intentionally run once on mount only — subsequent location changes are
    // handled by the sharedLocationChanged listener below.
  }, []);

  // Refresh immediately when the tab/app becomes visible again — the
  // interval-based auto-refresh skips ticks while hidden, so without this
  // a user returning to the page would see stale data until the next tick.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchConditions(coords?.lat, coords?.lon);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [fetchConditions, coords]);

  useEffect(() => {
    const onLocationChange = (e) => {
      const { name, lat, lon } = e.detail || {};
      if (lat && lon) {
        setLocationName(name);
        setCoords({ lat, lon, name });
        fetchConditions(lat, lon);
      }
    };
    window.addEventListener('sharedLocationChanged', onLocationChange);
    return () => window.removeEventListener('sharedLocationChanged', onLocationChange);
  }, [fetchConditions]);

  const loadNotes = useCallback(async (stationId) => {
    if (!stationId) { setNotes([]); return; }
    try {
      const results = await base44.entities.RiverNote.filter({ station_id: stationId }, '-created_date', 100);
      setNotes(results);
    } catch (e) {
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    loadNotes(data?.station?.id);
  }, [data?.station?.id, loadNotes]);

  // Used by both river/station-name search results and "Nearby Stations"
  // rows — jumps straight to that exact station rather than re-searching
  // for the nearest one to a point.
  const selectStation = (station) => {
    setLocationName(station.name);
    if (station.lat != null && station.lon != null) {
      setSharedLocation(station.name, station.lat, station.lon);
      setCoords({ lat: station.lat, lon: station.lon, name: station.name });
    }
    fetchConditionsForStation(station.id, station.name);
  };

  const handleDeleteNote = async (noteId) => {
    if (!noteId) return;
    try {
      await base44.entities.RiverNote.delete(noteId);
      await loadNotes(data?.station?.id);
    } catch (e) {
      // keep silent — the note stays in the list
    }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim() || !data?.station?.id) return;
    setSavingNote(true);
    try {
      await base44.entities.RiverNote.create({
        station_id: data.station.id,
        station_name: data.station.name,
        location_name: locationName,
        lat: coords.lat,
        lon: coords.lon,
        level: data.current?.level ?? null,
        discharge: data.current?.discharge ?? null,
        note: noteText.trim(),
      });
      setNoteText('');
      setNoteDialogOpen(false);
      await loadNotes(data.station.id);
    } catch (e) {
      // leave the text in place so the user doesn't lose what they typed
    } finally {
      setSavingNote(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const advisory = buildAdvisory(data);

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="space-y-3 md:space-y-4 -mt-4 md:-mt-8">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Header */}
          <div className="px-1 mb-2 flex items-center justify-between">
            <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight flex items-center gap-2">
              <Waves className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              River Conditions
            </h1>
            {data && !error && (
              <button
                onClick={() => setMapPickerOpen(true)}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{locationName}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
            )}
          </div>

          {error && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={() => fetchConditions(coords.lat, coords.lon)}>Try Again</Button>
              </CardContent>
            </Card>
          )}

          {data && !error && (
            <>
              {/* Nearest station card */}
              <Card className="bg-primary/10">
                <CardContent className="p-3 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate">{data.station.name}</p>
                      <button
                        onClick={() => setNoteDialogOpen(true)}
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                        aria-label="Add note"
                      >
                        <Pen className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Station {data.station.id} · {data.station.distanceKm} km away · Updated {data.current?.datetimeLocal ? new Date(data.current.datetimeLocal).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-secondary rounded-xl flex items-center gap-2 p-2.5">
                      <Droplets className="w-6 h-6 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold leading-tight">{data.current?.level != null ? `${data.current.level.toFixed(2)} m` : '—'}</p>
                          <TrendIndicator trend={data.trend?.level} />
                        </div>
                        <span className="text-xs text-muted-foreground leading-tight">Water Level <span className="text-[10px] text-muted-foreground/70 ml-2">{data.current?.datetimeLocal ? new Date(data.current.datetimeLocal).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}</span></span>
                      </div>
                    </div>
                    <div className="bg-secondary rounded-xl flex items-center gap-2 p-2.5">
                      <Gauge className="w-6 h-6 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold leading-tight">{data.current?.discharge != null ? `${data.current.discharge.toFixed(1)} m³/s` : '—'}</p>
                          <TrendIndicator trend={data.trend?.discharge} />
                        </div>
                        <span className="text-xs text-muted-foreground leading-tight">Flow <span className="text-[10px] text-muted-foreground/70 ml-2">{data.current?.datetimeLocal ? new Date(data.current.datetimeLocal).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}</span></span>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Hourly chart + historical overlay */}
              <Card>
                <CardHeader className="pt-3 pb-2 px-3">
                  <CardTitle className="text-base">Water Level (Today)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2 px-3">
                  <RiverLevelChart hourly={data.hourly} field="level" unitLabel="m" normalLevel={data.normal?.median} overlayHourly={historicalHourly} overlayLabel={overlayLabel} />
                  {advisory && (
                    <div className={`rounded-lg p-2.5 flex items-start gap-2 mt-2 ${advisory.tone}`}>
                      <advisory.icon className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-xs leading-snug">{advisory.text}</p>
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t border-border/60">
                    <HistoricalRangeChart stationId={data.station.id} stationName={data.station.name} field="level" unitLabel="m" currentValue={data.current?.level} normalLevel={data.normal?.median} onDataChange={setHistoricalHourly} onRangeChange={setOverlayLabel} />
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pt-3 pb-2 px-3">
                  <CardTitle className="text-base">Notes for this location</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2 px-3 space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No notes yet for this location.</p>
                  ) : (
                    <div className="space-y-2">
                      {notes.map((n) => (
                        <div key={n.id} className="border-b border-border/60 last:border-b-0 pb-2 last:pb-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-muted-foreground">
                              WL: {n.level != null ? `${n.level.toFixed(2)} m` : '—'} · Flow: {n.discharge != null ? `${n.discharge.toFixed(1)} m³/s` : '—'}{n.created_date ? ` · ${new Date(n.created_date.endsWith('Z') || n.created_date.includes('+') ? n.created_date : n.created_date + 'Z').toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}
                            </span>
                            <button
                              onClick={() => handleDeleteNote(n.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                              aria-label="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm text-foreground leading-snug">{n.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Nearby stations */}
              {data.nearbyStations?.length > 0 && (
                <Card>
                  <CardHeader className="pt-3 pb-2 px-3">
                    <CardTitle className="text-base">Nearby Stations</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-2 px-3">
                    <div className="flex flex-col">
                      {data.nearbyStations.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => selectStation(s)}
                          className="w-full flex items-center justify-between py-1 px-1 rounded-lg hover:bg-secondary transition-colors text-left"
                        >
                          <span className="text-sm text-foreground">{s.name}</span>
                          <span className="text-xs text-muted-foreground">{s.distanceKm} km</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <p className="text-[10px] text-muted-foreground text-center px-4 pb-2">
                Hydrometric data from Environment and Climate Change Canada (ECCC). Water level/flow only — no official water temperature is published for these stations.
              </p>
            </>
          )}
        </div>

        <RiverStationMapPicker
          open={mapPickerOpen}
          onOpenChange={setMapPickerOpen}
          initialCoords={coords}
          onSelect={selectStation}
        />

        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pen className="w-4 h-4 text-primary" />
                Add Note
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              WL: {data.current?.level != null ? `${data.current.level.toFixed(2)} m` : '—'} · Flow: {data.current?.discharge != null ? `${data.current.discharge.toFixed(1)} m³/s` : '—'} (auto-captured on save)
            </p>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. water conditions were green but not clear, fishing conditions were ideal..."
              className="text-sm min-h-[100px]"
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveNote} disabled={!noteText.trim() || savingNote} className="gap-1.5">
                {savingNote ? 'Saving…' : 'Save Note'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PullToRefresh>
  );
}