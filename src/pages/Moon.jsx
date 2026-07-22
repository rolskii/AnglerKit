import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getMoonTimes } from '@/lib/moonTimes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Waves, MapPin, Bell, BellOff, Save, Star, Moon as MoonIcon } from 'lucide-react';
import FishIcon from '@/components/FishIcon';
import { searchLocations, geocodeLocation } from '@/lib/geocode';
import { getSharedLocation, setSharedLocation, initDefaultLocationFromGPS } from '@/lib/sharedLocation';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import LocationMapPicker from '@/components/moon/LocationMapPicker';
import DayRatingRing from '@/components/moon/DayRatingRing';
import ActivityChart from '@/components/moon/ActivityChart';
import SunMoonFooter from '@/components/moon/SunMoonFooter';
import WeeklyBiteForecast from '@/components/moon/WeeklyBiteForecast';
import DaySolunarDialog from '@/components/moon/DaySolunarDialog';
import ShareStatusButton from '@/components/ShareStatusButton';
import { clearFiredAlarms } from '@/lib/alarmService';
import { ensurePushSubscription, syncAlarmToServer, removeAlarmFromServer } from '@/lib/pushService';
import PullToRefresh from '@/components/PullToRefresh';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const parseTimeFromIso = (isoStr) => {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return null;
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
};
const parseToMinutes = (isoStr) => {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
};
const minutesToTime = (mins) => {
  let h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h >= 24) h -= 24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};
const computeActivityLevels = (major, minor) => {
  const slotSize = 30;
  const count = (24 * 60) / slotSize;
  const levels = [];
  for (let i = 0; i < count; i++) {
    const slotStart = i * slotSize;
    const slotMid = slotStart + slotSize / 2;
    let level = 12;
    for (const m of major) {
      if (m.startMin === undefined) continue;
      const overlap = Math.min(m.endMin, slotStart + slotSize) - Math.max(m.startMin, slotStart);
      if (overlap > 0) level = Math.max(level, 95);
      else {
        const dist = Math.min(Math.abs(m.startMin - slotMid), Math.abs(m.endMin - slotMid));
        if (dist < 30) level = Math.max(level, 65);
        else if (dist < 60) level = Math.max(level, 38);
      }
    }
    for (const m of minor) {
      if (m.startMin === undefined) continue;
      const overlap = Math.min(m.endMin, slotStart + slotSize) - Math.max(m.startMin, slotStart);
      if (overlap > 0) level = Math.max(level, 65);
      else {
        const dist = Math.min(Math.abs(m.startMin - slotMid), Math.abs(m.endMin - slotMid));
        if (dist < 15) level = Math.max(level, 42);
      }
    }
    levels.push(level);
  }
  return levels;
};
const buildSolunarTimes = (moonTimes, sunData) => {
  const major = [];
  const minor = [];
  if (moonTimes) {
    // Major: 2-hour windows centered on moon overhead (transit) and underfoot
    if (moonTimes.transit != null) {
      const t = Math.round(moonTimes.transit);
      major.push({
        text: 'Moon overhead',
        time: `${minutesToTime(t - 60)} - ${minutesToTime(t + 60)}`,
        startMin: t - 60,
        endMin: t + 60,
      });
    }
    if (moonTimes.underfoot != null) {
      const t = Math.round(moonTimes.underfoot);
      major.push({
        text: 'Moon underfoot',
        time: `${minutesToTime(t - 60)} - ${minutesToTime(t + 60)}`,
        startMin: t - 60,
        endMin: t + 60,
      });
    }
    // Minor: 1-hour windows centered on moonrise and moonset
    if (moonTimes.moonrise != null) {
      const t = Math.round(moonTimes.moonrise);
      minor.push({
        text: 'Moonrise',
        time: `${minutesToTime(t - 30)} - ${minutesToTime(t + 30)}`,
        startMin: t - 30,
        endMin: t + 30,
      });
    }
    if (moonTimes.moonset != null) {
      const t = Math.round(moonTimes.moonset);
      minor.push({
        text: 'Moonset',
        time: `${minutesToTime(t - 30)} - ${minutesToTime(t + 30)}`,
        startMin: t - 30,
        endMin: t + 30,
      });
    }
  }
  return { major, minor };
};
export default function Moon() {
  const [moonData, setMoonData] = useState(null);
  const sharedInit = getSharedLocation();
  const [location, setLocation] = useState(sharedInit.name);
  const [editingLocation, setEditingLocation] = useState(sharedInit.name);
  const [coords, setCoords] = useState(sharedInit.coords);
  const [sunDataByDate, setSunDataByDate] = useState({});
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [alarmsByDate, setAlarmsByDate] = useState(() => {
    const stored = localStorage.getItem('alarmsByDate');
    return stored ? JSON.parse(stored) : {};
  });
  const rawDayAlarms = alarmsByDate[selectedDate];
  const currentDayAlarmList = Array.isArray(rawDayAlarms) ? rawDayAlarms : (rawDayAlarms && rawDayAlarms.time ? [rawDayAlarms] : []);
  const [pendingTime, setPendingTime] = useState(null);
  const [pendingOffset, setPendingOffset] = useState(15);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [weeklyForecastOpen, setWeeklyForecastOpen] = useState(false);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [savedLocations, setSavedLocations] = useState(() => {
    const stored = localStorage.getItem('moonSavedLocations');
    return stored ? JSON.parse(stored) : [];
  });
  const contentRef = useRef(null);
  useEffect(() => {
    const syncSaved = () => {
      const stored = localStorage.getItem('moonSavedLocations');
      setSavedLocations(stored ? JSON.parse(stored) : []);
    };
    window.addEventListener('moonSavedLocationsChanged', syncSaved);
    return () => window.removeEventListener('moonSavedLocationsChanged', syncSaved);
  }, []);
  const handleSelectDay = (dateStr) => {
    setSelectedDate(dateStr);
    setWeeklyForecastOpen(false);
    setDayDetailOpen(true);
  };
  const openLocationDialog = () => {
    setLocationDialogOpen(true);
  };
  const selectLocationFromMap = (name, lat, lon) => {
    handleLocationChange(name, lat, lon);
  };
  const isLocationSaved = () => {
    return savedLocations.some(loc => loc.name === location);
  };
  const toggleSaveLocation = () => {
    if (isLocationSaved()) {
      const updated = savedLocations.filter(loc => loc.name !== location);
      setSavedLocations(updated);
      localStorage.setItem('moonSavedLocations', JSON.stringify(updated));
    } else {
      const newLoc = { name: location, lat: coords.lat, lon: coords.lon };
      const updated = [...savedLocations, newLoc];
      setSavedLocations(updated);
      localStorage.setItem('moonSavedLocations', JSON.stringify(updated));
    }
  };
  const selectSavedLocation = (loc) => {
    handleLocationChange(loc.name, loc.lat, loc.lon);
  };
  // Moon phase calculation
  const calculateMoonPhase = (date) => {
    const knownNewMoon = new Date(2000, 0, 6);
    const lunarMonth = 29.53058867;
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const daysInCycle = daysSinceNewMoon % lunarMonth;
    const illumination = (1 - Math.cos(Math.PI * 2 * (daysInCycle / lunarMonth))) / 2;
    let name = 'New Moon';
    if (daysInCycle < 1.84) name = 'New Moon';
    else if (daysInCycle < 7.38) name = 'Waxing Crescent';
    else if (daysInCycle < 9.23) name = 'First Quarter';
    else if (daysInCycle < 14.77) name = 'Waxing Gibbous';
    else if (daysInCycle < 16.61) name = 'Full Moon';
    else if (daysInCycle < 23.15) name = 'Waning Gibbous';
    else if (daysInCycle < 25) name = 'Last Quarter';
    else name = 'Waning Crescent';
    return { name, illumination, daysInCycle };
  };
  const calculateFishingRating = (daysInCycle) => {
    const lunarMonth = 29.53058867;
    const distFromNew = Math.min(daysInCycle, lunarMonth - daysInCycle);
    const distFromFull = Math.abs(daysInCycle - lunarMonth / 2);
    const distFromMajor = Math.min(distFromNew, distFromFull);
    if (distFromMajor < 1) return 7;
    if (distFromMajor < 2.5) return 6;
    if (distFromMajor < 4.5) return 5;
    if (distFromMajor < 6) return 4;
    return 3;
  };
  const getRatingLabel = (rating) => {
    if (rating >= 7) return 'Excellent';
    if (rating >= 6) return 'Very Good';
    if (rating >= 5) return 'Good';
    if (rating >= 4) return 'Fair';
    return 'Moderate';
  };
  // Calculate moon data when date or location changes
  useEffect(() => {
    const [year, month, day] = selectedDate.split('-');
    const date = new Date(year, month - 1, day);
    const phase = calculateMoonPhase(date);
    setMoonData({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      phase: phase.name,
      illumination: Math.round(phase.illumination * 100),
      location: location,
      fishingRating: calculateFishingRating(phase.daysInCycle),
    });
  }, [location, selectedDate]);
  // On first mount with no saved location, try GPS before falling back to Toronto
  useEffect(() => {
    const init = async () => {
      await initDefaultLocationFromGPS();
      const loc = getSharedLocation();
      setLocation(loc.name);
      setEditingLocation(loc.name);
      setCoords(loc.coords);
    };
    init();
  }, []);
  // Fetch sun data from Environment Canada when coords change
  const fetchSunData = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('ecweather', { lat: coords.lat, lon: coords.lon });
      const data = res.data;
      if (data.daily && data.daily.time) {
        const byDate = {};
        data.daily.time.forEach((d, i) => {
          byDate[d] = { sunriseIso: data.daily.sunrise?.[i], sunsetIso: data.daily.sunset?.[i] };
        });
        setSunDataByDate(byDate);
      }
    } catch (e) {}
  }, [coords]);
  useEffect(() => {
    fetchSunData();
  }, [fetchSunData]);
  // Periodic background refresh + a manual trigger the pull-to-refresh
  // gesture below can call directly — both share this one fetch.
  const { refresh: refreshMoon } = useAutoRefresh(fetchSunData, 15 * 60 * 1000);
  // Location handling
  const handleLocationChange = async (selectedLocation, lat, lon) => {
    const locationToUse = (typeof selectedLocation === 'string' && selectedLocation) || editingLocation;
    if (!locationToUse || !locationToUse.trim()) return;
    setEditingLocation(locationToUse);
    setLocation(locationToUse);
    setPendingTime(null);
    setShowSuggestions(false);
    if (lat !== undefined && lon !== undefined) {
      setSharedLocation(locationToUse, lat, lon);
      setCoords({ lat, lon, name: locationToUse });
    } else {
      try {
        const result = await geocodeLocation(locationToUse);
        if (result) {
          setSharedLocation(locationToUse, result.lat, result.lon);
          setCoords({ lat: result.lat, lon: result.lon, name: locationToUse });
        }
      } catch (e) {}
    }
  };
  const handleLocationInput = async (value) => {
    setEditingLocation(value);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const results = await searchLocations(value, 5);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (err) {
      setSuggestions([]);
    }
  };
  // Alarm handling
  const parseTimeToMinutes = (timeStr) => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  const toggleAlarm = (timeStr) => {
    const existing = currentDayAlarmList.find(a => a.time === timeStr);
    if (existing) {
      const newList = currentDayAlarmList.filter(a => a.time !== timeStr);
      const updated = { ...alarmsByDate };
      if (newList.length === 0) delete updated[selectedDate];
      else updated[selectedDate] = newList;
      setAlarmsByDate(updated);
      setPendingTime(null);
      clearFiredAlarms();
      removeAlarmFromServer(selectedDate, timeStr);
      return;
    }
    setPendingTime(timeStr);
    setPendingOffset(15);
  };
  const saveAlarm = () => {
    if (!pendingTime) return;
    const timeInMinutes = parseTimeToMinutes(pendingTime);
    if (!timeInMinutes) return;
    const offset = pendingOffset;
    const existing = currentDayAlarmList.find(a => a.time === pendingTime);
    const newList = existing
      ? currentDayAlarmList.map(a => a.time === pendingTime ? { time: pendingTime, enabled: true, offset } : a)
      : [...currentDayAlarmList, { time: pendingTime, enabled: true, offset }];
    setAlarmsByDate({ ...alarmsByDate, [selectedDate]: newList });
    clearFiredAlarms();
    ensurePushSubscription();
    syncAlarmToServer(selectedDate, pendingTime, pendingOffset, location);
    if ('Notification' in window && Notification.permission !== 'granted') {
      import('@/components/ui/use-toast').then(({ toast }) => {
        toast({
          title: 'Enable notifications',
          description: 'Go to Settings to enable push notifications so this alarm fires when the app is closed.',
        });
      });
    }
    setPendingTime(null);
  };
  // Persist alarms & cleanup
  useEffect(() => {
    localStorage.setItem('alarmsByDate', JSON.stringify(alarmsByDate));
  }, [alarmsByDate]);
  useEffect(() => {
    if (currentDayAlarmList.length > 0 && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [currentDayAlarmList.length]);
  const moonTimes = useMemo(() => {
    const [year, month, day] = selectedDate.split('-');
    const date = new Date(year, month - 1, day);
    return getMoonTimes(date, coords.lat, coords.lon);
  }, [selectedDate, coords]);
  const sunData = useMemo(() => {
    const raw = sunDataByDate[selectedDate];
    if (!raw) return null;
    const sunriseMin = parseToMinutes(raw.sunriseIso);
    const sunsetMin = parseToMinutes(raw.sunsetIso);
    if (sunriseMin == null || sunsetMin == null) return null;
    return {
      sunrise: parseTimeFromIso(raw.sunriseIso),
      sunset: parseTimeFromIso(raw.sunsetIso),
      zenith: minutesToTime((sunriseMin + sunsetMin) / 2),
      sunriseMin,
      sunsetMin,
    };
  }, [sunDataByDate, selectedDate]);
  const currentSlot = Math.floor((new Date().getHours() * 60 + new Date().getMinutes()) / 30);
  const multiDayActivity = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const offset = i - 3;
    const [yr, mo, dy] = selectedDate.split('-');
    const date = new Date(yr, mo - 1, dy);
    date.setDate(date.getDate() + offset);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const phase = calculateMoonPhase(date);
    const rating = calculateFishingRating(phase.daysInCycle);
    const dayMoon = getMoonTimes(date, coords.lat, coords.lon);
    const daySun = sunDataByDate[dateStr];
    const dayMajor = [];
    if (dayMoon.transit != null) dayMajor.push({ startMin: Math.round(dayMoon.transit) - 60, endMin: Math.round(dayMoon.transit) + 60 });
    if (dayMoon.underfoot != null) dayMajor.push({ startMin: Math.round(dayMoon.underfoot) - 60, endMin: Math.round(dayMoon.underfoot) + 60 });
    const dayMinor = [];
    if (dayMoon.moonrise != null) dayMinor.push({ startMin: Math.round(dayMoon.moonrise) - 30, endMin: Math.round(dayMoon.moonrise) + 30 });
    if (dayMoon.moonset != null) dayMinor.push({ startMin: Math.round(dayMoon.moonset) - 30, endMin: Math.round(dayMoon.moonset) + 30 });
    if (daySun) {
      const sr = parseToMinutes(daySun.sunriseIso);
      const ss = parseToMinutes(daySun.sunsetIso);
      if (sr != null) dayMinor.push({ startMin: sr - 30, endMin: sr + 30 });
      if (ss != null) dayMinor.push({ startMin: ss - 30, endMin: ss + 30 });
    }
    const fullLevels = computeActivityLevels(dayMajor, dayMinor);
    const scaleFactor = 0.55 + (rating / 7) * 0.45;
    const dayLevels = fullLevels.map(l => Math.round(l * scaleFactor)).slice(10);
    const isTodayDay = dateStr === todayStr();
    const highlightIndex = isTodayDay
      ? (currentSlot >= 10 ? currentSlot - 10 : null)
      : dayLevels.indexOf(Math.max(...dayLevels));
    return {
      dateStr,
      label: isTodayDay ? 'Today' : offset === 0 ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : offset === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      levels: dayLevels,
      highlightIndex,
    };
  }), [selectedDate, coords, sunDataByDate, currentSlot]);
  if (!moonData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }
  const solunar = buildSolunarTimes(moonTimes, sunData);
  const ratingPercent = Math.round((moonData.fishingRating / 7) * 100);
  return (
    <PullToRefresh onRefresh={refreshMoon}>
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8">
      <div className="max-w-2xl mx-auto space-y-4">
      <div ref={contentRef} className="space-y-4">
        {/* Header */}
        <div className="space-y-2 px-1">
          <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight flex items-center gap-2">
          <MoonIcon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          Moon Phase
        </h1>
        </div>
        {/* Day Rating Card */}
        <Card>
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <DayRatingRing percentage={ratingPercent} rating={moonData.fishingRating} ratingLabel={getRatingLabel(moonData.fishingRating).toUpperCase()} />
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <FishIcon
                      key={n}
                      className={`w-6 h-6 text-primary transition-opacity ${n <= moonData.fishingRating ? 'opacity-100' : 'opacity-25'}`}
                    />
                  ))}
                </div>
                <div className="flex flex-col items-start gap-1.5 mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-xs text-primary/70 hover:text-primary transition-colors bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full border border-primary/20 font-medium">
                        For: {moonData.date}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pl-3" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(selectedDate + 'T00:00:00')}
                        onSelect={(date) => {
                          if (date) {
                            const y = date.getFullYear();
                            const m = String(date.getMonth() + 1).padStart(2, '0');
                            const d = String(date.getDate()).padStart(2, '0');
                            setSelectedDate(`${y}-${m}-${d}`);
                          }
                        }}
                        className="p-3"
                        classNames={{
                          head_cell: "text-muted-foreground rounded-md w-12 font-normal text-sm",
                          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                          day: "h-11 w-11 p-0 font-normal text-sm aria-selected:opacity-100",
                          nav_button: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100",
                          caption_label: "text-base font-medium",
                        }}
                        modifiers={{
                          goodFishing: (date) => {
                            const phase = calculateMoonPhase(date);
                            return calculateFishingRating(phase.daysInCycle) >= 5;
                          },
                        }}
                        modifiersStyles={{
                          goodFishing: {
                            border: '2px solid #16a34a',
                            borderRadius: '50%',
                          },
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative flex items-center gap-1">
                    <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-0.5 border border-border">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <input
                        value={editingLocation}
                        onChange={(e) => handleLocationInput(e.target.value)}
                        onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
                        onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); handleLocationChange(editingLocation); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setShowSuggestions(false); handleLocationChange(editingLocation); } }}
                        placeholder="Search location..."
                        className="text-xs bg-transparent outline-none w-32 placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <button
                      onClick={openLocationDialog}
                      className="p-1 rounded-full hover:bg-accent/20 text-muted-foreground hover:text-primary transition-colors"
                      title="Pick on map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-[5000] top-full left-0 mt-1 max-h-48 overflow-y-auto bg-popover rounded-lg shadow-lg border border-border min-w-48">
                        {suggestions.map((s, i) => (
                          <button
                            key={i}
                            onMouseDown={(e) => { e.preventDefault(); handleLocationChange(s.name, s.lat, s.lon); setShowSuggestions(false); }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent/10 truncate flex items-center gap-1.5"
                          >
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={`shrink-0 relative w-20 h-20 flex items-center justify-center ${moonData.fishingRating >= 5 ? 'animate-pulse-slow' : ''}`}>
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={moonData.fishingRating >= 5 ? '#16a34a' : '#ca8a04'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(ratingPercent / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                  />
                </svg>
                <span
                  className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setWeeklyForecastOpen(true)}
                >
                  {ratingPercent}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Activity Chart */}
        <Card>
          <CardHeader className="pt-3 pb-0">
            <CardTitle className="text-base">Hourly Fish Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <ActivityChart days={multiDayActivity} scrollToDate={selectedDate} />
          </CardContent>
        </Card>
        {/* Major & Minor Times — Two Columns */}
        <Card className="bg-card border-primary/20">
          <CardHeader className="pt-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              Solunar Feeding Times
              <Waves className="w-5 h-5 text-primary" />
            </CardTitle>
            <CardDescription>Major & minor feeding windows for {moonData.date}</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 pb-3">
            <div className="grid grid-cols-2 gap-2">
              {/* Major Times */}
              <div className="border-r border-border pr-2">
                <p className="text-xs font-bold text-primary tracking-wide mb-3">MAJOR TIME</p>
                <ul className="space-y-2">
                  {solunar.major.map((item, idx) => {
                    const alarmTime = item.time.split(' - ')[0];
                    const hasAlarm = currentDayAlarmList.some(a => a.time === alarmTime);
                    return (
                      <li key={idx}>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                           <p className="text-sm font-medium whitespace-nowrap">{item.time}</p>
                           <button
                             onClick={() => toggleAlarm(alarmTime)}
                            className={`p-1 rounded-md flex items-center transition-colors ${
                              hasAlarm
                                ? 'bg-primary text-primary-foreground'
                                : pendingTime === alarmTime
                                  ? 'bg-accent text-accent-foreground'
                                  : 'bg-primary/20 text-primary hover:bg-primary/30'
                            }`}
                          >
                            {hasAlarm ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{item.text}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {/* Minor Times */}
              <div>
                <p className="text-xs font-bold text-amber-500 tracking-wide mb-3">MINOR TIME</p>
                <ul className="space-y-2">
                  {solunar.minor.map((item, idx) => (
                    <li key={idx}>
                      <p className="text-sm font-medium whitespace-nowrap">{item.time}</p>
                      <p className="text-[10px] text-muted-foreground">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Pending alarm UI */}
            {(pendingTime || currentDayAlarmList.length > 0) && (
              <div className="mt-4 space-y-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                {pendingTime ? (
                  <>
                    <p className="text-xs font-medium text-primary">Set alarm for {pendingTime}</p>
                    <p className="text-xs text-muted-foreground">Choose how early to be reminded, then save.</p>
                    <div className="flex gap-2">
                      {[0, 5, 10, 15].map((min) => (
                        <button
                          key={min}
                          onClick={() => setPendingOffset(min)}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                            pendingOffset === min ? 'bg-primary text-primary-foreground' : 'bg-background text-primary border border-primary/30 hover:bg-primary/20'
                          }`}
                        >
                          {min}m
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveAlarm}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Alarm
                      </button>
                      <button
                        onClick={() => setPendingTime(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background text-muted-foreground border border-border hover:bg-muted transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {currentDayAlarmList.map(alarm => (
                      <div key={alarm.time} className="flex items-center justify-between">
                        <p className="text-xs font-medium text-primary">
                          ⏰ {alarm.offset === 0 ? 'at' : alarm.offset + ' min before'} {alarm.time}
                        </p>
                        <p className="text-xs text-green-600">✓ Active</p>
                      </div>
                    ))}
                    <p className="text-xs text-green-600">
                      {currentDayAlarmList.length} alarm{currentDayAlarmList.length !== 1 ? 's' : ''} active for {selectedDate}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Sun & Moon Footer */}
        <Card>
          <CardContent className="pt-3 pb-3">
            <SunMoonFooter
              sunrise={sunData?.sunrise}
              sunset={sunData?.sunset}
              zenith={sunData?.zenith}
              moonPhase={moonData.phase}
              illumination={moonData.illumination}
            />
          </CardContent>
        </Card>
        {/* Fishing Tips */}
        <Card className="bg-secondary/30 border-0 shadow-none">
          <CardHeader className="pt-0 pb-2">
            <CardTitle className="text-base">Fishing Tips for {moonData.phase}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm pt-0 pb-3">
            {moonData.phase === 'Full Moon' && (
              <>
                <p className="whitespace-nowrap">✓ Excellent — bright light aids fish spotting prey</p>
                <p className="whitespace-nowrap">✓ Night fishing is particularly productive</p>
                <p className="whitespace-nowrap">✓ Fish more active in deeper water during the day</p>
              </>
            )}
            {moonData.phase === 'New Moon' && (
              <>
                <p className="whitespace-nowrap">✓ Daytime fishing can be excellent — less light, more feeding</p>
                <p className="whitespace-nowrap">✓ Night fishing is challenging due to darkness</p>
                <p className="whitespace-nowrap">✓ Darker nights push fish to feed more during day</p>
              </>
            )}
            {(moonData.phase.includes('Crescent') || moonData.phase.includes('Gibbous')) && (
              <>
                <p className="whitespace-nowrap">✓ Transitional phase — good all-around fishing</p>
                <p className="whitespace-nowrap">✓ Balance between day and night feeding activity</p>
                <p className="whitespace-nowrap">✓ Consistent activity throughout the day</p>
              </>
            )}
            {moonData.phase.includes('Quarter') && (
              <>
                <p className="whitespace-nowrap">✓ Moderate fishing conditions</p>
                <p className="whitespace-nowrap">✓ Morning and evening peaks are more pronounced</p>
                <p className="whitespace-nowrap">✓ Follow solunar feeding times closely</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
        {/* Share */}
        <div className="px-1">
          <ShareStatusButton
            targetRef={contentRef}
            title={`Moon & Fishing — ${moonData.date}`}
            text={[
              `🌙 ${moonData.phase} (${moonData.illumination}% illuminated)`,
              `🐟 Fishing Rating: ${getRatingLabel(moonData.fishingRating)} (${moonData.fishingRating}/7)`,
              `📍 ${moonData.location}`,
              solunar.major.length ? `Major: ${solunar.major.map(m => m.time).join(', ')}` : '',
              solunar.minor.length ? `Minor: ${solunar.minor.map(m => m.time).join(', ')}` : '',
              sunData?.sunrise ? `Sunrise: ${parseTimeFromIso(sunData.sunrise)}` : '',
              sunData?.sunset ? `Sunset: ${parseTimeFromIso(sunData.sunset)}` : '',
            ].filter(Boolean).join('\n')}
          />
        </div>
      </div>
      <WeeklyBiteForecast
        open={weeklyForecastOpen}
        onOpenChange={setWeeklyForecastOpen}
        startDate={selectedDate}
        onSelectDay={handleSelectDay}
      />
      <DaySolunarDialog
        open={dayDetailOpen}
        onOpenChange={setDayDetailOpen}
        moonData={moonData}
        solunar={solunar}
        sunData={sunData}
        currentDayAlarmList={currentDayAlarmList}
        onToggleAlarm={toggleAlarm}
        pendingTime={pendingTime}
        setPendingTime={setPendingTime}
        pendingOffset={pendingOffset}
        setPendingOffset={setPendingOffset}
        onSaveAlarm={saveAlarm}
      />
      <LocationMapPicker
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        initialCoords={coords}
        savedLocations={savedLocations}
        onSelect={selectLocationFromMap}
      />
    </div>
    </PullToRefresh>
  );
}