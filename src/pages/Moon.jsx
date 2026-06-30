import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon as MoonIcon, Sun, Waves, MapPin, Bell, BellOff } from 'lucide-react';

export default function Moon() {
  const [moonData, setMoonData] = useState(null);
  const savedLocation = localStorage.getItem('moonLocation');
  const savedCoords = localStorage.getItem('moonCoords');
  const [location, setLocation] = useState(savedLocation || 'Toronto');
  const [editingLocation, setEditingLocation] = useState(savedLocation || 'Toronto');
  const [lastCoords, setLastCoords] = useState(savedCoords ? JSON.parse(savedCoords) : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sunTimes, setSunTimes] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [alarmsByDate, setAlarmsByDate] = useState(() => {
    const stored = localStorage.getItem('alarmsByDate');
    return stored ? JSON.parse(stored) : {};
  });
  const currentDayAlarms = alarmsByDate[selectedDate] || { time: null, enabled: false, offset: 15 };
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (lastCoords) {
      fetchMoonData(lastCoords.lat, lastCoords.lon, lastCoords.name || location, selectedDate);
    } else {
      handleLocationChange(editingLocation);
    }
  }, [selectedDate]);

  const fetchMoonData = async (lat, lon, locationName, dateStr) => {
    try {
      setLoading(true);
      setError(null);
      const [year, month, day] = dateStr.split('-');
      const date = new Date(year, month - 1, day);
      const phase = calculateMoonPhase(date);

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=sunrise,sunset,moonrise,moonset&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
      );
      const data = await response.json();

      const fmtTime = (isoStr) => isoStr ? new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A';
      const times = {
        sunrise: fmtTime(data.daily?.sunrise?.[0]),
        sunset: fmtTime(data.daily?.sunset?.[0]),
        moonrise: fmtTime(data.daily?.moonrise?.[0]),
        moonset: fmtTime(data.daily?.moonset?.[0]),
      };

      setSunTimes(times);
      setMoonData({
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        phase: phase.name,
        illumination: Math.round(phase.illumination * 100),
        location: locationName,
        ...times,
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch moon data for that location.');
      setLoading(false);
    }
  };

  const handleLocationChange = async (selectedLocation) => {
    const loc = (typeof selectedLocation === 'string' && selectedLocation) || editingLocation;
    if (!loc || !loc.trim()) return;

    if (lastCoords && loc.trim() === location) {
      fetchMoonData(lastCoords.lat, lastCoords.lon, lastCoords.name || loc, selectedDate);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&language=en&count=1&format=json`
      );
      const geoData = await geoResponse.json();
      if (!geoData.results?.[0]) {
        setError('Location not found. Please try another search.');
        setLoading(false);
        return;
      }
      const result = geoData.results[0];
      const coords = { lat: result.latitude, lon: result.longitude, name: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}` };
      setLastCoords(coords);
      localStorage.setItem('moonLocation', coords.name);
      localStorage.setItem('moonCoords', JSON.stringify(coords));
      setLocation(coords.name);
      setEditingLocation(coords.name);
      setShowSuggestions(false);
      await fetchMoonData(coords.lat, coords.lon, coords.name, selectedDate);
    } catch (err) {
      setError('Failed to fetch data for that location.');
      setLoading(false);
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
        setSuggestions(data.results.map(r => `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`));
        setShowSuggestions(true);
      }
    } catch (err) {
      setSuggestions([]);
    }
  };

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
    if (currentDayAlarms.time === timeStr) {
      const updated = { ...alarmsByDate };
      delete updated[selectedDate];
      setAlarmsByDate(updated);
      return;
    }

    const timeInMinutes = parseTimeToMinutes(timeStr);
    if (!timeInMinutes) return;

    const alarmTime = new Date();
    const alarmHours = Math.floor(timeInMinutes / 60);
    const alarmMinutes = timeInMinutes % 60;
    alarmTime.setHours(alarmHours, alarmMinutes, 0);

    // Subtract selected offset
    alarmTime.setMinutes(alarmTime.getMinutes() - currentDayAlarms.offset);

    setAlarmsByDate({
      ...alarmsByDate,
      [selectedDate]: { time: timeStr, enabled: true, offset: currentDayAlarms.offset }
    });

    // Check alarm every minute
    const alarmInterval = setInterval(() => {
      const now = new Date();
      if (now >= alarmTime && currentDayAlarms.enabled) {
        playAlarm();
        clearInterval(alarmInterval);
      }
    }, 60000);
  };

  const playAlarm = () => {
    const timeText = currentDayAlarms.offset === 0 ? 'now' : `in ${currentDayAlarms.offset} minutes`;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Fishing Time!', {
        body: `Your selected feeding time (${currentDayAlarms.time}) starts ${timeText}. Time to head out!`,
        icon: '🎣',
      });
    }
    // Fallback: alert
    alert(`🎣 Time to fish! Your feeding window (${currentDayAlarms.time}) is starting ${timeText}!`);
  };

  useEffect(() => {
    localStorage.setItem('alarmsByDate', JSON.stringify(alarmsByDate));
  }, [alarmsByDate]);

  useEffect(() => {
    if (currentDayAlarms.enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [currentDayAlarms.enabled]);

  const calculateMoonPhase = (date) => {
    const knownNewMoon = new Date(2000, 0, 6);
    const lunarMonth = 29.53058867;
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const daysInCycle = daysSinceNewMoon % lunarMonth;
    const illumination = (1 + Math.cos(Math.PI * 2 * (daysInCycle / lunarMonth))) / 2;
    
    let name = 'New Moon';
    if (daysInCycle < 1.84) name = 'New Moon';
    else if (daysInCycle < 7.38) name = 'Waxing Crescent';
    else if (daysInCycle < 9.23) name = 'First Quarter';
    else if (daysInCycle < 14.77) name = 'Waxing Gibbous';
    else if (daysInCycle < 16.61) name = 'Full Moon';
    else if (daysInCycle < 23.15) name = 'Waning Gibbous';
    else if (daysInCycle < 25) name = 'Last Quarter';
    else name = 'Waning Crescent';
    
    return { name, illumination };
  };

  const getSolunarTimes = () => {
    if (!sunTimes) return { major: [], minor: [] };

    const addMinutes = (timeStr, mins) => {
      const start = parseTimeToMinutes(timeStr);
      if (!start) return timeStr;
      const end = start + mins;
      let endHours = Math.floor(end / 60) % 24;
      const endMins = end % 60;
      const period = endHours >= 12 ? 'PM' : 'AM';
      if (endHours === 0) endHours = 12;
      else if (endHours > 12) endHours -= 12;
      return `${endHours}:${String(endMins).padStart(2, '0')} ${period}`;
    };

    const major = [];
    if (sunTimes.moonrise && sunTimes.moonrise !== 'N/A') {
      major.push({ text: 'Moonrise to 2 hrs after', time: `${sunTimes.moonrise} - ${addMinutes(sunTimes.moonrise, 120)}` });
    }
    major.push({ text: 'Moon highest point (approx.)', time: '12:30 PM' });
    if (sunTimes.moonset && sunTimes.moonset !== 'N/A') {
      major.push({ text: 'Moonset to 2 hrs after', time: `${sunTimes.moonset} - ${addMinutes(sunTimes.moonset, 120)}` });
    }

    const minor = [];
    if (sunTimes.sunrise && sunTimes.sunrise !== 'N/A') {
      minor.push({ text: 'Sun rise to 30 min after', time: `${sunTimes.sunrise} - ${addMinutes(sunTimes.sunrise, 30)}` });
    }
    if (sunTimes.sunset && sunTimes.sunset !== 'N/A') {
      minor.push({ text: 'Sun set to 30 min after', time: `${sunTimes.sunset} - ${addMinutes(sunTimes.sunset, 30)}` });
    }

    return { major, minor };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!moonData) return null;

  const solunar = getSolunarTimes();

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Moon Phase</h1>
          <p className="text-muted-foreground">Lunar forecasting for your next fishing trip</p>
          
          {/* Location & Date Selector */}
          <div className="mt-6 flex gap-2 max-w-md mx-auto flex-col sm:flex-row">
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
                      onClick={() => handleLocationChange(suggestion)}
                      className="w-full px-3 py-2.5 text-xs text-left hover:bg-primary/10 border-b border-border/50 last:border-b-0 transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground"
            />
            <button
              onClick={() => handleLocationChange()}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Update
            </button>
          </div>
        </div>

        {moonData && (
          <>
            {/* Current Moon Phase Card */}
            <Card className="bg-primary/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{moonData.phase}</CardTitle>
                <CardDescription>{moonData.date}</CardDescription>
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mt-2">
                  <MapPin className="w-4 h-4" />
                  {moonData.location}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Moon Visualization */}
                <div className="flex justify-center">
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-b from-slate-200 to-slate-300 flex items-center justify-center shadow-lg">
                    <div className="absolute inset-0 rounded-full" style={{
                      background: `conic-gradient(
                        #1a1a1a 0deg,
                        #1a1a1a ${moonData.illumination * 3.6}deg,
                        #e5e5e5 ${moonData.illumination * 3.6}deg,
                        #e5e5e5 360deg
                      )`,
                      opacity: 0.85
                    }}></div>
                    <MoonIcon className="w-12 h-12 text-white z-10" />
                  </div>
                </div>

                {/* Illumination */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Moon Illumination</p>
                  <p className="text-4xl font-bold text-primary">{moonData.illumination}%</p>
                </div>

                {/* Rise/Set Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card p-4 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Sunrise</p>
                    <p className="font-semibold">{moonData.sunrise}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Sunset</p>
                    <p className="font-semibold">{moonData.sunset}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Solunar Fishing Times */}
            {solunar && (
              <>
                <Card className="bg-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Waves className="w-5 h-5 text-primary" />
                      Major Feeding Times (Solunar)
                    </CardTitle>
                    <CardDescription>Peak fishing activity based on lunar position</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {solunar.major.map((item, idx) => (
                        <li key={idx} className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <span className="text-sm">{item.text}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleAlarm(item.time.split(' - ')[0])}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 flex-shrink-0 transition-colors ${
                              currentDayAlarms.time === item.time.split(' - ')[0]
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-primary/20 text-primary hover:bg-primary/30'
                            }`}
                          >
                            {currentDayAlarms.time === item.time.split(' - ')[0] ? (
                              <>
                                <BellOff className="w-3.5 h-3.5" />
                                Cancel
                              </>
                            ) : (
                              <>
                                <Bell className="w-3.5 h-3.5" />
                                Alarm
                              </>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {currentDayAlarms.time && (
                      <div className="mt-4 space-y-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-xs font-medium text-primary">
                          ⏰ Alarm set for {currentDayAlarms.offset === 0 ? 'at' : currentDayAlarms.offset + ' minutes before'} {currentDayAlarms.time}
                        </p>
                        <div className="flex gap-2">
                          {[0, 5, 10, 15].map((min) => (
                            <button
                              key={min}
                              onClick={() => setAlarmsByDate({
                                ...alarmsByDate,
                                [selectedDate]: { ...currentDayAlarms, offset: min }
                              })}
                              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                                currentDayAlarms.offset === min
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-background text-primary border border-primary/30 hover:bg-primary/20'
                              }`}
                            >
                              {min}m
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      Duration: ~1.5-2 hours per period. Fish are most active during these times.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sun className="w-5 h-5 text-amber-500" />
                      Minor Feeding Times
                    </CardTitle>
                    <CardDescription>Secondary periods of increased activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {solunar.minor.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <span className="text-sm">{item.text}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-4">
                      Duration: ~30 min per period. Shorter but still productive windows.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Fishing Tips */}
            <Card className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="text-base">Fishing Tips for {moonData.phase}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {moonData.phase === 'Full Moon' && (
                  <>
                    <p>✓ Excellent fishing conditions—bright light aids fish spotting of prey</p>
                    <p>✓ Night fishing is particularly productive</p>
                    <p>✓ Fish may be more active in deeper water during the day</p>
                  </>
                )}
                {moonData.phase === 'New Moon' && (
                  <>
                    <p>✓ Daytime fishing can be excellent—less light means more feeding</p>
                    <p>✓ Night fishing is challenging due to darkness</p>
                    <p>✓ Darker nights push fish to feed more during day</p>
                  </>
                )}
                {(moonData.phase.includes('Crescent') || moonData.phase.includes('Gibbous')) && (
                  <>
                    <p>✓ Transitional phase—good all-around fishing conditions</p>
                    <p>✓ Balance between day and night feeding activity</p>
                    <p>✓ Consistent activity throughout the day</p>
                  </>
                )}
                {(moonData.phase.includes('Quarter')) && (
                  <>
                    <p>✓ Moderate fishing conditions</p>
                    <p>✓ Morning and evening peaks are more pronounced</p>
                    <p>✓ Follow solunar feeding times closely</p>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}