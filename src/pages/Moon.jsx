import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon as MoonIcon, Sun, Waves, MapPin, Bell, BellOff, Save } from 'lucide-react';
import FishIcon from '@/components/FishIcon';

export default function Moon() {
  const [moonData, setMoonData] = useState(null);
  const savedLocation = localStorage.getItem('moonLocation');
  const [location, setLocation] = useState(savedLocation || 'Toronto, ON');
  const [editingLocation, setEditingLocation] = useState(savedLocation || 'Toronto, ON');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [alarmsByDate, setAlarmsByDate] = useState(() => {
    const stored = localStorage.getItem('alarmsByDate');
    return stored ? JSON.parse(stored) : {};
  });
  const currentDayAlarms = alarmsByDate[selectedDate] || { time: null, enabled: false, offset: 15 };
  const [pendingTime, setPendingTime] = useState(null);
  const [pendingOffset, setPendingOffset] = useState(15);
  const alarmIntervalRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const calculateMoonData = () => {
      const [year, month, day] = selectedDate.split('-');
      const date = new Date(year, month - 1, day);
      const phase = calculateMoonPhase(date);
      
      setMoonData({
        date: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        phase: phase.name,
        illumination: Math.round(phase.illumination * 100),
        moonrise: 'Sunrise: 5:48 AM',
        moonset: 'Sunset: 8:54 PM',
        location: location,
        fishingRating: calculateFishingRating(phase.daysInCycle),
      });
    };

    calculateMoonData();
  }, [location, selectedDate]);

  const handleLocationChange = (selectedLocation) => {
    const locationToUse = (typeof selectedLocation === 'string' && selectedLocation) || editingLocation;
    if (locationToUse && locationToUse.trim()) {
      localStorage.setItem('moonLocation', locationToUse);
      setEditingLocation(locationToUse);
      setLocation(locationToUse);
      setPendingTime(null);
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
    // If there's already a saved alarm for this time → cancel it
    if (currentDayAlarms.time === timeStr) {
      const updated = { ...alarmsByDate };
      delete updated[selectedDate];
      setAlarmsByDate(updated);
      setPendingTime(null);
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
        alarmIntervalRef.current = null;
      }
      return;
    }
    // Otherwise open the pending alarm config
    setPendingTime(timeStr);
    setPendingOffset(currentDayAlarms.offset || 15);
  };

  const saveAlarm = () => {
    if (!pendingTime) return;

    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    const timeInMinutes = parseTimeToMinutes(pendingTime);
    if (!timeInMinutes) return;

    const offset = pendingOffset;
    const alarmHours = Math.floor(timeInMinutes / 60);
    const alarmMinutes = timeInMinutes % 60;

    // Compute the alarm target — if already passed today, schedule for tomorrow
    const alarmTime = new Date();
    alarmTime.setHours(alarmHours, alarmMinutes, 0, 0);
    alarmTime.setMinutes(alarmTime.getMinutes() - offset);
    if (alarmTime <= new Date()) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    setAlarmsByDate({
      ...alarmsByDate,
      [selectedDate]: { time: pendingTime, enabled: true, offset }
    });

    // Request notification permission so we can show a system alert
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const trigger = () => {
      if (new Date() >= alarmTime) {
        playAlarm(pendingTime, offset);
        if (alarmIntervalRef.current) {
          clearInterval(alarmIntervalRef.current);
          alarmIntervalRef.current = null;
        }
      }
    };

    // Check every 5 seconds for timely triggering
    alarmIntervalRef.current = setInterval(trigger, 5000);
    // Also check immediately in case the time is right now
    trigger();

    setPendingTime(null);
  };

  const playAlarm = (time, offset) => {
    const timeText = offset === 0 ? 'now' : `in ${offset} minutes`;
    const message = `🎣 Time to fish! Your feeding window (${time}) is starting ${timeText}!`;

    // System notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Fishing Time!', {
        body: message,
        tag: 'fishing-alarm',
      });
    }

    // Friendly rising chime — maxed volume via compressor + layered oscillators
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        // Compressor boosts perceived loudness to the browser max
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -50;
        comp.knee.value = 0;
        comp.ratio.value = 20;
        comp.attack.value = 0.003;
        comp.release.value = 0.25;
        const master = ctx.createGain();
        master.gain.value = 1.0;
        comp.connect(master);
        master.connect(ctx.destination);

        const notes = [523.25, 659.25, 783.99, 1046.50];
        const noteDur = 0.22;
        notes.forEach((freq, i) => {
          const s = ctx.currentTime + i * (noteDur + 0.04);
          // Layer sine + triangle for a fuller, louder sound
          ['sine', 'triangle'].forEach(type => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(comp);
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, s);
            gain.gain.linearRampToValueAtTime(0.7, s + 0.03);
            gain.gain.setValueAtTime(0.7, s + noteDur - 0.04);
            gain.gain.linearRampToValueAtTime(0, s + noteDur);
            osc.start(s);
            osc.stop(s + noteDur + 0.02);
          });
        });
      }
    } catch (e) {}

    // Screen alert fallback
    alert(message);
  };

  useEffect(() => {
    localStorage.setItem('alarmsByDate', JSON.stringify(alarmsByDate));
  }, [alarmsByDate]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }
    };
  }, []);

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

  const getSolunarTimes = (phase) => {
    const major = [
      { text: 'Moonrise to 2 hrs after', time: '5:48 AM - 7:48 AM' },
      { text: 'Moon highest point', time: '12:30 PM' },
      { text: 'Moonset to 2 hrs after', time: '8:54 PM - 10:54 PM' }
    ];
    const minor = [
      { text: 'Sun rise to 30 min after', time: '5:48 AM - 6:18 AM' },
      { text: 'Sun set to 30 min after', time: '8:54 PM - 9:24 PM' }
    ];
    
    return { major, minor };
  };

  if (!moonData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const solunar = getSolunarTimes(moonData.phase);

  return (
    <div className="min-h-screen bg-background px-4 pb-20 pt-0">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Moon Phase</h1>
          <p className="text-muted-foreground">Check lunar phases and solunar feeding times to plan your fishing trips.</p>
          
          {/* Location & Date Selector */}
          <div className="mt-6 flex gap-2 max-w-md mx-auto flex-row items-center">
            <div className="flex-1 relative">
              <label className="block text-xs text-muted-foreground mb-1 text-left">Location</label>
              <input
                type="text"
                value={editingLocation}
                onChange={(e) => handleLocationInput(e.target.value)}
                placeholder="Enter location"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground text-left"
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
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground mb-1 text-left">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground text-left"
              />
            </div>
          </div>
        </div>

        {moonData && (
          <>
            {/* Current Moon Phase Card */}
            <Card className="bg-primary/10">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{moonData.phase}</CardTitle>
                <CardDescription>{moonData.date}</CardDescription>
                <div className="flex justify-center gap-2 mt-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <FishIcon
                      key={n}
                      className={`w-7 h-7 text-primary transition-opacity ${
                        n <= moonData.fishingRating
                          ? 'opacity-100'
                          : 'opacity-25'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-primary mt-2">
                  {moonData.fishingRating}/7 — {getRatingLabel(moonData.fishingRating)}
                </p>
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
                    <p className="font-semibold">5:48 AM</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Sunset</p>
                    <p className="font-semibold">8:54 PM</p>
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
                                : pendingTime === item.time.split(' - ')[0]
                                  ? 'bg-accent text-accent-foreground'
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
                    {(pendingTime || currentDayAlarms.time) && (
                      <div className="mt-4 space-y-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        {pendingTime ? (
                          <>
                            <p className="text-xs font-medium text-primary">
                              Set alarm for {pendingTime}
                            </p>
                            <p className="text-xs text-muted-foreground">Choose how early to be reminded, then save.</p>
                            <div className="flex gap-2">
                              {[0, 5, 10, 15].map((min) => (
                                <button
                                  key={min}
                                  onClick={() => setPendingOffset(min)}
                                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                                    pendingOffset === min
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-background text-primary border border-primary/30 hover:bg-primary/20'
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
                                <Save className="w-3.5 h-3.5" />
                                Save Alarm
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
                          <>
                            <p className="text-xs font-medium text-primary">
                              ⏰ Alarm saved — {currentDayAlarms.offset === 0 ? 'at' : currentDayAlarms.offset + ' minutes before'} {currentDayAlarms.time}
                            </p>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              ✓ Active for {selectedDate}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => playAlarm('12:30 PM', 15)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-1.5 transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Test Alarm
                      </button>
                      <span className="text-xs text-muted-foreground">Play a sample alarm now</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
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