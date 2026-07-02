import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Waves, MapPin, Bell, BellOff, Save } from 'lucide-react';
import FishIcon from '@/components/FishIcon';
import LocationMapPicker from '@/components/moon/LocationMapPicker';
import DayRatingRing from '@/components/moon/DayRatingRing';
import DateSelector from '@/components/moon/DateSelector';
import ActivityChart from '@/components/moon/ActivityChart';
import SunMoonFooter from '@/components/moon/SunMoonFooter';

const todayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const parseTimeFromIso = (isoStr) => {
  if (!isoStr) return null;
  const timePart = isoStr.split('T')[1];
  if (!timePart) return null;
  const [hours, minutes] = timePart.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${String(minutes).padStart(2, '0')} ${period}`;
};

const parseToMinutes = (isoStr) => {
  if (!isoStr) return null;
  const timePart = isoStr.split('T')[1];
  if (!timePart) return null;
  const [hours, minutes] = timePart.split(':').map(Number);
  return hours * 60 + minutes;
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

export default function Moon() {
  const [moonData, setMoonData] = useState(null);
  const savedLocation = localStorage.getItem('moonLocation');
  const [location, setLocation] = useState(savedLocation || 'Toronto, ON');
  const [editingLocation, setEditingLocation] = useState(savedLocation || 'Toronto, ON');
  const [coords, setCoords] = useState(() => {
    const stored = localStorage.getItem('moonCoords');
    return stored ? JSON.parse(stored) : { lat: 43.6532, lon: -79.3832, name: 'Toronto, ON' };
  });
  const [sunData, setSunData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [alarmsByDate, setAlarmsByDate] = useState(() => {
    const stored = localStorage.getItem('alarmsByDate');
    return stored ? JSON.parse(stored) : {};
  });
  const rawDayAlarms = alarmsByDate[selectedDate];
  const currentDayAlarmList = Array.isArray(rawDayAlarms) ? rawDayAlarms : (rawDayAlarms && rawDayAlarms.time ? [rawDayAlarms] : []);
  const [pendingTime, setPendingTime] = useState(null);
  const [pendingOffset, setPendingOffset] = useState(15);
  const alarmIntervalsRef = useRef({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const openLocationDialog = () => {
    setLocationDialogOpen(true);
  };

  const selectLocationFromMap = (name, lat, lon) => {
    handleLocationChange(name, lat, lon);
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

  const getSolunarTimes = () => {
    const major = [
      { text: 'Moonrise to 2 hrs after', time: '5:48 AM - 7:48 AM', startMin: 348, endMin: 468 },
      { text: 'Moon highest point', time: '12:30 PM', startMin: 750, endMin: 780 },
      { text: 'Moonset to 2 hrs after', time: '8:54 PM - 10:54 PM', startMin: 1254, endMin: 1374 }
    ];
    const minor = [
      { text: 'Sun rise to 30 min after', time: '5:48 AM - 6:18 AM', startMin: 348, endMin: 378 },
      { text: 'Sun set to 30 min after', time: '8:54 PM - 9:24 PM', startMin: 1254, endMin: 1284 }
    ];
    return { major, minor };
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

  // Fetch sun data when date or coords change
  useEffect(() => {
    const fetchSunData = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=sunrise,sunset&timezone=auto&start_date=${selectedDate}&end_date=${selectedDate}`
        );
        const data = await res.json();
        if (data.daily && data.daily.sunrise && data.daily.sunrise[0]) {
          const sunriseMin = parseToMinutes(data.daily.sunrise[0]);
          const sunsetMin = parseToMinutes(data.daily.sunset[0]);
          const zenithMin = (sunriseMin + sunsetMin) / 2;
          setSunData({
            sunrise: parseTimeFromIso(data.daily.sunrise[0]),
            sunset: parseTimeFromIso(data.daily.sunset[0]),
            zenith: minutesToTime(zenithMin),
          });
        }
      } catch (e) {}
    };
    fetchSunData();
  }, [selectedDate, coords]);

  // Location handling
  const handleLocationChange = async (selectedLocation, lat, lon) => {
    const locationToUse = (typeof selectedLocation === 'string' && selectedLocation) || editingLocation;
    if (!locationToUse || !locationToUse.trim()) return;

    localStorage.setItem('moonLocation', locationToUse);
    setEditingLocation(locationToUse);
    setLocation(locationToUse);
    setPendingTime(null);
    setShowSuggestions(false);

    if (lat !== undefined && lon !== undefined) {
      const newCoords = { lat, lon, name: locationToUse };
      localStorage.setItem('moonCoords', JSON.stringify(newCoords));
      setCoords(newCoords);
    } else {
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationToUse)}&language=en&count=1&format=json`
        );
        const data = await response.json();
        if (data.results && data.results[0]) {
          const newCoords = { lat: data.results[0].latitude, lon: data.results[0].longitude, name: locationToUse };
          localStorage.setItem('moonCoords', JSON.stringify(newCoords));
          setCoords(newCoords);
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
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&language=en&count=5&format=json`
      );
      const data = await response.json();
      if (data.results) {
        setSuggestions(data.results.map(r => ({
          name: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`,
          lat: r.latitude,
          lon: r.longitude
        })));
        setShowSuggestions(true);
      }
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
      if (alarmIntervalsRef.current[timeStr]) {
        clearInterval(alarmIntervalsRef.current[timeStr]);
        delete alarmIntervalsRef.current[timeStr];
      }
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
    const alarmHours = Math.floor(timeInMinutes / 60);
    const alarmMinutes = timeInMinutes % 60;

    const alarmTime = new Date();
    alarmTime.setHours(alarmHours, alarmMinutes, 0, 0);
    alarmTime.setMinutes(alarmTime.getMinutes() - offset);
    if (alarmTime <= new Date()) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    const existing = currentDayAlarmList.find(a => a.time === pendingTime);
    const newList = existing
      ? currentDayAlarmList.map(a => a.time === pendingTime ? { time: pendingTime, enabled: true, offset } : a)
      : [...currentDayAlarmList, { time: pendingTime, enabled: true, offset }];

    setAlarmsByDate({ ...alarmsByDate, [selectedDate]: newList });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (alarmIntervalsRef.current[pendingTime]) {
      clearInterval(alarmIntervalsRef.current[pendingTime]);
    }

    const alarmKey = pendingTime;
    const trigger = () => {
      if (new Date() >= alarmTime) {
        playAlarm(alarmKey, offset);
        if (alarmIntervalsRef.current[alarmKey]) {
          clearInterval(alarmIntervalsRef.current[alarmKey]);
          delete alarmIntervalsRef.current[alarmKey];
        }
      }
    };

    alarmIntervalsRef.current[alarmKey] = setInterval(trigger, 5000);
    trigger();
    setPendingTime(null);
  };

  const playAlarm = (time, offset) => {
    const timeText = offset === 0 ? 'now' : `in ${offset} minutes`;
    const message = `🎣 Time to fish! Your feeding window (${time}) is starting ${timeText}!`;

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Fishing Time!', { body: message, tag: 'fishing-alarm' });
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = 0.7;
        master.connect(ctx.destination);

        const pulseDur = 0.12;
        const pulseGap = 0.05;
        const cycleGap = 0.25;
        const tones = [988, 740];
        const burstLen = tones.length * (pulseDur + pulseGap);
        for (let burst = 0; burst < 4; burst++) {
          tones.forEach((freq, i) => {
            const s = ctx.currentTime + burst * (burstLen + cycleGap) + i * (pulseDur + pulseGap);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(master);
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, s);
            gain.gain.linearRampToValueAtTime(0.6, s + 0.005);
            gain.gain.setValueAtTime(0.6, s + pulseDur - 0.01);
            gain.gain.linearRampToValueAtTime(0, s + pulseDur);
            osc.start(s);
            osc.stop(s + pulseDur + 0.005);
          });
        }
      }
    } catch (e) {}

    alert(message);
  };

  // Persist alarms & cleanup
  useEffect(() => {
    localStorage.setItem('alarmsByDate', JSON.stringify(alarmsByDate));
  }, [alarmsByDate]);

  useEffect(() => {
    return () => {
      Object.values(alarmIntervalsRef.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    if (currentDayAlarmList.length > 0 && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [currentDayAlarmList.length]);

  if (!moonData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const solunar = getSolunarTimes();
  const ratingPercent = Math.round((moonData.fishingRating / 7) * 100);
  const fullActivityLevels = computeActivityLevels(solunar.major, solunar.minor);
  const activityLevels = fullActivityLevels.slice(10); // start from 5am (slot 10)
  const isToday = selectedDate === todayStr();
  const currentSlot = Math.floor((new Date().getHours() * 60 + new Date().getMinutes()) / 30);
  const currentInterval = isToday
    ? (currentSlot >= 10 ? currentSlot - 10 : null)
    : activityLevels.indexOf(Math.max(...activityLevels));

  return (
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="space-y-2 px-1">
          <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight">Moon Phase</h1>
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
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={openLocationDialog}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <MapPin className="w-3 h-3" />{moonData.location}
                  </button>
                </div>
              </div>
              <div className={`shrink-0 ${moonData.fishingRating >= 5 ? 'text-green-600' : moonData.fishingRating <= 3 ? 'text-yellow-600' : 'text-primary'}`}>
                <span className="text-3xl font-bold text-foreground">{ratingPercent}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Selector */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <DateSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hourly Fish Activity</CardTitle>

          </CardHeader>
          <CardContent>
            <ActivityChart levels={activityLevels} highlightIndex={currentInterval} />
          </CardContent>
        </Card>

        {/* Major & Minor Times — Two Columns */}
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Waves className="w-5 h-5 text-primary" />
              Solunar Feeding Times
            </CardTitle>
            <CardDescription>Major & minor feeding windows for {moonData.date}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[3fr_2fr] gap-4">
              {/* Major Times */}
              <div className="border-r border-border pr-4">
                <p className="text-xs font-bold text-primary tracking-wide mb-3">MAJOR TIME</p>
                <ul className="space-y-2">
                  {solunar.major.map((item, idx) => {
                    const alarmTime = item.time.split(' - ')[0];
                    const hasAlarm = currentDayAlarmList.some(a => a.time === alarmTime);
                    return (
                      <li key={idx}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.time}</p>
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
                      <p className="text-sm font-medium">{item.time}</p>
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

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => playAlarm('12:30 PM', 15)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-foreground hover:bg-accent/90 flex items-center gap-1.5 transition-colors"
              >
                <Bell className="w-3.5 h-3.5" /> Test Alarm
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Sun & Moon Footer */}
        <Card>
          <CardContent className="pt-6">
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
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fishing Tips for {moonData.phase}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm px-5 py-3">
            {moonData.phase === 'Full Moon' && (
              <>
                <p className="whitespace-nowrap">✓ Excellent fishing — bright light aids fish spotting prey</p>
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
                <p className="whitespace-nowrap">✓ Transitional phase — good all-around fishing conditions</p>
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

      <LocationMapPicker
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        initialCoords={coords}
        onSelect={selectLocationFromMap}
      />
    </div>
  );
}