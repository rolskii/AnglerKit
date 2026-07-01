import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Camera, Moon as MoonIcon, Cloud, CloudRain, Sun, Bell, MapPin } from "lucide-react";
import { ReelIcon as ReelDiscIcon } from "@/components/GearIcons";
import FishIcon from "@/components/FishIcon";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import FeaturedImage from "@/components/FeaturedImage";

const calculateMoonPhase = (date) => {
  const knownNewMoon = new Date(2000, 0, 6);
  const lunarMonth = 29.53058867;
  const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const daysInCycle = daysSinceNewMoon % lunarMonth;
  const illumination = (1 + Math.cos(Math.PI * 2 * (daysInCycle / lunarMonth))) / 2;

  let name = "New Moon";
  if (daysInCycle < 1.84) name = "New Moon";
  else if (daysInCycle < 7.38) name = "Waxing Crescent";
  else if (daysInCycle < 9.23) name = "First Quarter";
  else if (daysInCycle < 14.77) name = "Waxing Gibbous";
  else if (daysInCycle < 16.61) name = "Full Moon";
  else if (daysInCycle < 23.15) name = "Waning Gibbous";
  else if (daysInCycle < 25) name = "Last Quarter";
  else name = "Waning Crescent";

  const lunarMonthLen = 29.53058867;
  const distFromNew = Math.min(daysInCycle, lunarMonthLen - daysInCycle);
  const distFromFull = Math.abs(daysInCycle - lunarMonthLen / 2);
  const distFromMajor = Math.min(distFromNew, distFromFull);
  let fishingRating = 3;
  if (distFromMajor < 1) fishingRating = 7;
  else if (distFromMajor < 2.5) fishingRating = 6;
  else if (distFromMajor < 4.5) fishingRating = 5;
  else if (distFromMajor < 6) fishingRating = 4;

  return { name, illumination: Math.round(illumination * 100), fishingRating };
};

const getWeatherIcon = (code) => {
  if (code === 0 || code === 1) return Sun;
  if (code === 2 || code === 3) return Cloud;
  if (code >= 45 && code <= 99) return CloudRain;
  return Cloud;
};

const getWeatherDescription = (code) => {
  const codes = {
    0: "Clear", 1: "Mostly Clear", 2: "Partly Cloudy", 3: "Cloudy",
    45: "Foggy", 48: "Foggy", 51: "Light Drizzle", 53: "Drizzle",
    55: "Heavy Drizzle", 61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
    71: "Light Snow", 73: "Snow", 75: "Heavy Snow",
    80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
    85: "Light Snow Showers", 86: "Snow Showers",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
  };
  return codes[code] || "Unknown";
};

const parseTimeToMinutes = (timeStr) => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getNextBiteWindow = () => {
  const periods = [
    { start: "5:48 AM", end: "7:48 AM" },
    { start: "8:54 PM", end: "10:54 PM" },
  ];
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  for (const p of periods) {
    const startMin = parseTimeToMinutes(p.start);
    if (startMin && startMin > nowMin) return p;
  }
  return periods[0];
};

const items = [
  { to: "/gear/lines", title: "Gear", icon: ReelDiscIcon, tint: "orange", key: "gear" },
  { to: "/catches", title: "Fish Log", icon: Camera, tint: "blue", key: "catch" },
  { to: "/moon", title: "Moon Phase", icon: MoonIcon, tint: "purple", key: "moon" },
  { to: "/weather", title: "Weather", icon: Cloud, tint: "teal", key: "weather" },
];

const tintClasses = {
  orange: "bg-tint-orange-bg text-tint-orange",
  blue: "bg-tint-blue-bg text-tint-blue",
  purple: "bg-tint-purple-bg text-tint-purple",
  teal: "bg-tint-teal-bg text-tint-teal",
};

export default function Home() {
  const [moonPhase, setMoonPhase] = useState(null);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [descriptions, setDescriptions] = useState({});
  const [biteWindow, setBiteWindow] = useState(null);
  const [alarmTick, setAlarmTick] = useState(0);
  const [location, setLocation] = useState(() => localStorage.getItem('moonLocation') || 'Toronto, ON');

  const todayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getAlarmTimes = () => {
    try {
      const stored = localStorage.getItem('alarmsByDate');
      if (!stored) return [];
      const alarms = JSON.parse(stored);
      const dayAlarms = alarms[todayStr()];
      if (!dayAlarms) return [];
      const list = Array.isArray(dayAlarms) ? dayAlarms : [dayAlarms];
      return list.filter(a => a.enabled).map(a => a.time);
    } catch { return []; }
  };

  const refreshData = async () => {
    const phase = calculateMoonPhase(new Date());
    setMoonPhase(phase);
    setBiteWindow(getNextBiteWindow());
    setLocation(localStorage.getItem('moonLocation') || 'Toronto, ON');
    setDescriptions(prev => ({ ...prev, moon: `${phase.illumination}% illuminated` }));
    setAlarmTick(t => t + 1);

    const coords = JSON.parse(localStorage.getItem("weatherCoords") || "null");
    const tempUnit = localStorage.getItem("weatherTempUnit") || "celsius";
    if (coords) await fetchWeather(coords, tempUnit);

    await Promise.all([fetchGearCount(), fetchLastCatch()]);
  };

  useEffect(() => { refreshData(); }, []);

  useEffect(() => {
    const recheck = () => setAlarmTick(t => t + 1);
    window.addEventListener('focus', recheck);
    window.addEventListener('storage', recheck);
    return () => {
      window.removeEventListener('focus', recheck);
      window.removeEventListener('storage', recheck);
    };
  }, []);

  const fetchWeather = async (coords, tempUnit) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=${tempUnit}&wind_speed_unit=mph`
      );
      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const desc = getWeatherDescription(data.current.weather_code);
      const wind = data.current.wind_speed_10m;
      const windLabel = wind < 8 ? "Light wind" : wind < 15 ? "Breezy" : "Windy";
      const tempSymbol = tempUnit === "fahrenheit" ? "°F" : "°C";
      const WeatherIconComp = getWeatherIcon(data.current.weather_code);
      setWeatherInfo({ temp: `${temp}${tempSymbol}`, windLabel, desc, icon: WeatherIconComp });
      setDescriptions(prev => ({ ...prev, weather: desc }));
    } catch (e) {}
  };

  const fetchGearCount = async () => {
    try {
      const [lines, reels, rods, lures, misc] = await Promise.all([
        base44.entities.FlyLine.list("-created_date", 500),
        base44.entities.Reel.list("-created_date", 500),
        base44.entities.Rod.list("-created_date", 500),
        base44.entities.Lure.list("-created_date", 500),
        base44.entities.MiscItem.list("-created_date", 500),
      ]);
      const total = lines.length + reels.length + rods.length + lures.length + misc.length;
      setDescriptions(prev => ({ ...prev, gear: `${total} ${total === 1 ? "item" : "items"}` }));
    } catch (e) {}
  };

  const fetchLastCatch = async () => {
    try {
      const catches = await base44.entities.Catch.list("-date", 1);
      if (catches.length > 0 && catches[0].date) {
        const days = Math.floor((Date.now() - new Date(catches[0].date)) / (1000 * 60 * 60 * 24));
        const text = days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
        setDescriptions(prev => ({ ...prev, catch: `Last catch: ${text}` }));
      } else {
        setDescriptions(prev => ({ ...prev, catch: "No catches yet" }));
      }
    } catch (e) {}
  };

  return (
    <PullToRefresh onRefresh={refreshData}>
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8">
      {/* Hero */}
      <div className="space-y-2 px-1">
        <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight">Angler's Log</h1>
        <p className="text-sm md:text-[17px] text-muted-foreground">
          Track your gear, predict the bite with moon phases, check the water, and log every catch — all in one place.
        </p>
      </div>

      {/* Status bar */}
      {moonPhase && (
        <div className="px-4 py-3 rounded-2xl bg-card shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-foreground">Today's Fishing Conditions:</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <FishIcon
                    key={n}
                    className={`w-5 h-5 text-primary transition-opacity ${n <= moonPhase.fishingRating ? "opacity-100" : "opacity-25"}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${moonPhase.fishingRating >= 5 ? "text-green-600" : moonPhase.fishingRating <= 3 ? "text-yellow-600" : "text-primary"}`}>
                {moonPhase.fishingRating <= 2 ? "Bad" : moonPhase.fishingRating === 3 ? "Fair" : moonPhase.fishingRating === 4 ? "OK" : moonPhase.fishingRating === 5 ? "Good" : moonPhase.fishingRating === 6 ? "Very Good" : "Excellent"}
              </p>
              <Link to="/moon" className="text-xs font-semibold text-primary hover:underline">Details</Link>
              <p className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                <MapPin className="w-3 h-3" />{location}
              </p>
              {weatherInfo?.icon && (() => {
                const Icon = weatherInfo.icon;
                return <Icon className="w-16 h-16 text-primary mt-2" />;
              })()}
            </div>
          </div>
          <div className="flex items-start gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Major</p>
              <p className="text-xs text-foreground flex items-center gap-1">
                5:48–7:48 AM
                {getAlarmTimes().includes("5:48 AM") && <Bell className="w-3 h-3 text-primary" />}
              </p>
              <p className="text-xs text-foreground flex items-center gap-1">
                8:54–10:54 PM
                {getAlarmTimes().includes("8:54 PM") && <Bell className="w-3 h-3 text-primary" />}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Minor</p>
              <p className="text-xs text-foreground">5:48–6:18 AM</p>
              <p className="text-xs text-foreground">8:54–9:24 PM</p>
            </div>
          </div>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isGear = item.to === "/gear/lines";
          const desc = descriptions[item.key];
          return (
            <Link key={item.to} to={item.to} className="group">
              <Card className="relative p-2.5 md:p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
                <div className="flex flex-col gap-2 md:gap-3">
                  <div className={`flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl flex-shrink-0 ${tintClasses[item.tint]}`}>
                    <Icon className={isGear ? "w-6 md:w-10 h-6 md:h-10" : "w-5 md:w-8 h-5 md:h-8"} strokeWidth={2} />
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <h2 className="text-xs md:text-lg font-heading font-semibold tracking-tight leading-tight">{item.title}</h2>
                    {item.key === "weather" && weatherInfo ? (
                      <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">{weatherInfo.temp} · {weatherInfo.windLabel} · {weatherInfo.desc}</p>
                    ) : item.key === "moon" && moonPhase ? (
                      <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">{moonPhase.name} · {moonPhase.illumination}% lit</p>
                    ) : desc ? (
                      <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">{desc}</p>
                    ) : (
                      <p className="text-[10px] md:text-sm text-muted-foreground/40">—</p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <FeaturedImage />
</div>
    </PullToRefresh>
  );
}