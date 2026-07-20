import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Waves, MapPin, Bell, BellOff, Save } from 'lucide-react';
import FishIcon from '@/components/FishIcon';
import DateSelector from '@/components/moon/DateSelector';
import DayRatingRing from '@/components/moon/DayRatingRing';
import ActivityChart from '@/components/moon/ActivityChart';
import SunMoonFooter from '@/components/moon/SunMoonFooter';
import { syncAlarmToServer, removeAlarmFromServer } from '@/lib/pushService';
import {
  getSunTimes,
  getMoonTimes,
  getMoonTransit,
  getMoonIllumination,
  getMoonPhaseName,
  formatTime,
} from '@/lib/astronomy';

const LUNAR_MONTH = 29.53058867;
const DEFAULT_COORDS = { lat: 43.6532, lon: -79.3832 }; // Toronto, ON

const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const addMinutes = (date, min) => (date ? new Date(date.getTime() + min * 60000) : null);

function daysInCycleFor(date) {
  const knownNewMoon = new Date(2000, 0, 6);
  const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  return ((daysSinceNewMoon % LUNAR_MONTH) + LUNAR_MONTH) % LUNAR_MONTH;
}

// Fishing activity is traditionally strongest around new/full moon (major
// solunar periods) and tapers off near the quarters.
function getFishBitePercentage(daysCycle) {
  const distFromNew = Math.min(daysCycle, LUNAR_MONTH - daysCycle);
  const distFromFull = Math.abs(daysCycle - LUNAR_MONTH / 2);
  const distFromMajor = Math.min(distFromNew, distFromFull);
  const pct = 35 + 65 * Math.exp(-(distFromMajor ** 2) / (2 * 3.2 ** 2));
  return Math.max(20, Math.min(100, Math.round(pct)));
}

function getRatingLabel(pct) {
  if (pct >= 85) return 'Excellent';
  if (pct >= 70) return 'Very Good';
  if (pct >= 55) return 'Good';
  if (pct >= 40) return 'Fair';
  return 'Poor';
}

// 20 hourly activity samples covering 5am - 12am (midnight), matching
// ActivityChart's expected label layout (index 0 = 5am, index 19 = 12am).
function buildActivityLevels(baseDate, lat, lon) {
  const sun = getSunTimes(baseDate, lat, lon);
  const moon = getMoonTimes(baseDate, lat, lon);
  const transit = getMoonTransit(baseDate, lat, lon);

  const gaussian = (hour, centerDate, sigma) => {
    if (!centerDate) return 0;
    const centerHour = centerDate.getHours() + centerDate.getMinutes() / 60;
    let diff = Math.abs(hour - centerHour);
    if (diff > 12) diff = 24 - diff; // wrap around midnight
    return Math.exp(-(diff ** 2) / (2 * sigma ** 2));
  };

  const levels = [];
  for (let i = 0; i < 20; i++) {
    const hour = 5 + i;
    let level = 18;
    level += 70 * gaussian(hour, moon.rise, 1.1);
    level += 70 * gaussian(hour, moon.set, 1.1);
    level += 50 * gaussian(hour, transit, 1.3);
    level += 35 * gaussian(hour, sun.sunrise, 0.6);
    level += 35 * gaussian(hour, sun.sunset, 0.6);
    levels.push(Math.max(0, Math.min(100, Math.round(level))));
  }
  return levels;
}

export default function Moon() {
  const savedLocation = localStorage.getItem('moonLocation');
  const savedCoords = localStorage.getItem('moonCoords');
  const [location, setLocation] = useState(savedLocation || 'Toronto, ON');
  const [editingLocation, setEditingLocation] = useState(savedLocation || 'Toronto, ON');
  const [coords, setCoords] = useState(savedCoords ? JSON.parse(savedCoords) : DEFAULT_COORDS);
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [alarmsByDate, setAlarmsByDate] = useState(() => {
    const stored = localStorage.getItem('alarmsByDateV2');
    return stored ? JSON.parse(stored) : {};
  });
  const currentDayAlarmList = alarmsByDate[selectedDate] || [];
  const [pendingTime, setPendingTime] = useState(null);
  const [pendingOffset, setPendingOffset] = useState(15);
  const firedKeysRef = useRef(new Set());

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!savedCoords) {
            setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          }
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('alarmsByDateV2', JSON.stringify(alarmsByDate));
  }, [alarmsByDate]);

  // Reset any pending (unsaved) alarm selection when switching days.
  useEffect(() => {
    setPendingTime(null);
  }, [selectedDate]);

  useEffect(() => {
    const hasAnyAlarm = Object.values(alarmsByDate).some((list) => list.length > 0);
    if (hasAnyAlarm && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [alarmsByDate]);

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

  // In-tab immediate fallback: every 30s, check all saved alarms across all
  // dates and fire any that are due. The server-side checkAlarms function
  // covers the case where this tab isn't open.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      Object.entries(alarmsByDate).forEach(([date, list]) => {
        list.forEach((alarm) => {
          const key = `${date}|${alarm.time}`;
          if (firedKeysRef.current.has(key)) return;
          const minutes = parseTimeToMinutes(alarm.time);
          if (minutes == null) return;
          const [y, m, d] = date.split('-').map(Number);
          const alarmDate = new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60, 0);
          alarmDate.setMinutes(alarmDate.getMinutes() - alarm.offset);
          if (now >= alarmDate && now - alarmDate < 15 * 60000) {
            firedKeysRef.current.add(key);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🎣 Fishing Time!', {
                body: `Your feeding window (${alarm.time}) is starting${alarm.offset > 0 ? ` in ${alarm.offset} minutes` : ' now'}!`,
              });
            }
          }
        });
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [alarmsByDate]);

  const handleLocationChange = (selectedLocation) => {
    const locationToUse = (typeof selectedLocation === 'string' && selectedLocation) || editingLocation;
    if (locationToUse && locationToUse.trim()) {
      localStorage.setItem('moonLocation', locationToUse);
      setEditingLocation(locationToUse);
      setLocation(locationToUse);
      setShowSuggestions(false);
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
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&language=en&count=5&format=json`
      );
      const data = await response.json();
      if (data.results) {
        setSuggestions(data.results.map(r => ({
          label: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`,
          lat: r.latitude,
          lon: r.longitude,
        })));
        setShowSuggestions(true);
      }
    } catch (err) {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setEditingLocation(suggestion.label);
    setLocation(suggestion.label);
    setCoords({ lat: suggestion.lat, lon: suggestion.lon });
    localStorage.setItem('moonLocation', suggestion.label);
    localStorage.setItem('moonCoords', JSON.stringify({ lat: suggestion.lat, lon: suggestion.lon }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const onToggleAlarm = (timeStr) => {
    const existingIdx = currentDayAlarmList.findIndex(a => a.time === timeStr);
    if (existingIdx >= 0) {
      const updated = currentDayAlarmList.filter(a => a.time !== timeStr);
      setAlarmsByDate({ ...alarmsByDate, [selectedDate]: updated });
      removeAlarmFromServer(selectedDate, timeStr);
      firedKeysRef.current.delete(`${selectedDate}|${timeStr}`);
      return;
    }
    if (pendingTime === timeStr) {
      setPendingTime(null);
    } else {
      setPendingTime(timeStr);
      setPendingOffset(15);
    }
  };

  const onSaveAlarm = () => {
    if (!pendingTime) return;
    const newAlarm = { time: pendingTime, offset: pendingOffset };
    setAlarmsByDate({
      ...alarmsByDate,
      [selectedDate]: [...currentDayAlarmList, newAlarm],
    });
    syncAlarmToServer(selectedDate, pendingTime, pendingOffset, location);
    setPendingTime(null);
  };

  // --- Derived astronomy for the selected day ---
  const [y, m, d] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(y, m - 1, d, 12, 0, 0); // noon, avoids DST edge cases
  const daysCycle = daysInCycleFor(selectedDateObj);
  const illum = getMoonIllumination(selectedDateObj);
  const phaseName = getMoonPhaseName(illum.phase);
  const fishPct = getFishBitePercentage(daysCycle);
  const ratingTier = Math.max(1, Math.min(7, Math.round((fishPct / 100) * 7)));
  const ratingLabel = getRatingLabel(fishPct);

  const sunTimes = getSunTimes(selectedDateObj, coords.lat, coords.lon);
  const moonTimes = getMoonTimes(selectedDateObj, coords.lat, coords.lon);
  const moonTransit = getMoonTransit(selectedDateObj, coords.lat, coords.lon);

  const solunar = {
    major: [
      moonTimes.rise
        ? { text: 'Moonrise to 2 hrs after', time: `${formatTime(moonTimes.rise)} - ${formatTime(addMinutes(moonTimes.rise, 120))}` }
        : null,
      { text: 'Moon highest point', time: formatTime(moonTransit) },
      moonTimes.set
        ? { text: 'Moonset to 2 hrs after', time: `${formatTime(moonTimes.set)} - ${formatTime(addMinutes(moonTimes.set, 120))}` }
        : null,
    ].filter(Boolean),
    minor: [
      { text: 'Sunrise to 30 min after', time: `${formatTime(sunTimes.sunrise)} - ${formatTime(addMinutes(sunTimes.sunrise, 30))}` },
      { text: 'Sunset to 30 min after', time: `${formatTime(sunTimes.sunset)} - ${formatTime(addMinutes(sunTimes.sunset, 30))}` },
    ],
  };

  // Activity chart: 5-day window centered on the selected date, matching DateSelector.
  const todayStr = toDateStr(new Date());
  const activityDays = [-2, -1, 0, 1, 2].map((offset) => {
    const dt = new Date(selectedDateObj);
    dt.setDate(dt.getDate() + offset);
    const dateStr = toDateStr(dt);
    const isToday = dateStr === todayStr;
    const now = new Date();
    let highlightIndex = null;
    if (isToday) {
      const hour = now.getHours() + now.getMinutes() / 60;
      if (hour >= 5) highlightIndex = Math.min(19, Math.round(hour - 5));
    }
    return {
      dateStr,
      label: isToday ? 'Today' : dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      levels: buildActivityLevels(dt, coords.lat, coords.lon),
      highlightIndex,
    };
  });

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-display font-bold mb-2">Moon Phase</h1>
          <p className="text-muted-foreground text-sm">Check lunar phases and solunar feeding times to plan your fishing trips.</p>

          {/* Location Selector */}
          <div className="mt-4 flex gap-2 max-w-md mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={editingLocation}
                onChange={(e) => handleLocationInput(e.target.value)}
                placeholder="Enter location"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground text-center"
                onKeyPress={(e) => e.key === 'Enter' && handleLocationChange()}
                onFocus={(e) => {
                  e.target.select();
                  editingLocation.trim().length >= 2 && setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto" onMouseDown={(e) => e.preventDefault()}>
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full px-3 py-2.5 text-xs text-left hover:bg-primary/10 border-b border-border/50 last:border-b-0 transition-colors cursor-pointer"
                    >
                      {suggestion.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {location}
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardContent className="py-3">
            <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </CardContent>
        </Card>

        {/* Fish Bite Rating + Phase */}
        <Card className="bg-primary/10">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">{phaseName}</CardTitle>
            <CardDescription>
              {selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pb-6">
            <DayRatingRing percentage={fishPct} rating={ratingTier} ratingLabel={ratingLabel} />
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <FishIcon
                  key={n}
                  className={`w-5 h-5 transition-opacity ${n <= ratingTier ? 'opacity-100' : 'opacity-25'}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Fish Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hourly Fish Activity</CardTitle>
            <CardDescription>Predicted bite activity through the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityChart days={activityDays} scrollToDate={selectedDate} />
          </CardContent>
        </Card>

        {/* Solunar Feeding Times */}
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              Solunar Feeding Times
              <Waves className="w-5 h-5 text-primary" />
            </CardTitle>
            <CardDescription>Major & minor feeding windows for {selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
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
                            onClick={() => onToggleAlarm(alarmTime)}
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
                        onClick={onSaveAlarm}
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
                      {currentDayAlarmList.length} alarm{currentDayAlarmList.length !== 1 ? 's' : ''} active
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sun & Moon Footer */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <SunMoonFooter
              sunrise={formatTime(sunTimes.sunrise)}
              sunset={formatTime(sunTimes.sunset)}
              zenith={formatTime(sunTimes.solarNoon)}
              moonPhase={phaseName}
              illumination={Math.round(illum.fraction * 100)}
            />
          </CardContent>
        </Card>

        {/* Fishing Tips */}
        <Card className="bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-base">Fishing Tips for {phaseName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {phaseName === 'Full Moon' && (
              <>
                <p>✓ Excellent fishing conditions—bright light aids fish spotting of prey</p>
                <p>✓ Night fishing is particularly productive</p>
                <p>✓ Fish may be more active in deeper water during the day</p>
              </>
            )}
            {phaseName === 'New Moon' && (
              <>
                <p>✓ Daytime fishing can be excellent—less light means more feeding</p>
                <p>✓ Night fishing is challenging due to darkness</p>
                <p>✓ Darker nights push fish to feed more during day</p>
              </>
            )}
            {(phaseName.includes('Crescent') || phaseName.includes('Gibbous')) && (
              <>
                <p>✓ Transitional phase—good all-around fishing conditions</p>
                <p>✓ Balance between day and night feeding activity</p>
                <p>✓ Consistent activity throughout the day</p>
              </>
            )}
            {phaseName.includes('Quarter') && (
              <>
                <p>✓ Moderate fishing conditions</p>
                <p>✓ Morning and evening peaks are more pronounced</p>
                <p>✓ Follow solunar feeding times closely</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
