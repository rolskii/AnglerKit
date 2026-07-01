import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Camera, Moon as MoonIcon, Cloud, CloudRain, Sun, Bell, MapPin } from "lucide-react";
import { ReelIcon as ReelDiscIcon } from "@/components/GearIcons";
import FishIcon from "@/components/FishIcon";
import MoonPhaseSymbol from "@/components/MoonPhaseSymbol";
import { base44 } from "@/api/base44Client";
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
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const phase = calculateMoonPhase(midnight);
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
      const code = data.current.weather_code;
      const WeatherIconComp = getWeatherIcon(code);
      let iconColor = "text-primary";
      if (code === 0 || code === 1) iconColor = "text-yellow-500";
      else if (code === 2 || code === 3) iconColor = "text-sky-400";
      else iconColor = "text-blue-500";
      setWeatherInfo({ temp: `${temp}${tempSymbol}`, windLabel, desc, icon: WeatherIconComp, iconColor });
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
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8">
      {/* Hero */}
      <div className="space-y-2 px-1">
        <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight">Angler's Log</h1>
        <p className="text-sm md:text-[17px] text-muted-foreground">
          Track your gear, predict the bite with moon phases, check the water, and log every catch — all in one place.
        </p>
      </div>

      {/* Status Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">Major</p>
            <p className="text-sm font-semibold leading-tight">5:48a–7:48a</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">Minor</p>
            <p className="text-sm font-semibold leading-tight">8:54p–10:54p</p>
          </div>
          <div className="space-y-0.5 flex flex-col items-center">
            <p className="text-[11px] text-muted-foreground">Weather</p>
            {weatherInfo ? (
              <div className="flex items-center gap-1">
                <weatherInfo.icon className={`w-4 h-4 ${weatherInfo.iconColor}`} />
                <span className="text-sm font-semibold">{weatherInfo.temp}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
          <div className="space-y-0.5 flex flex-col items-center">
            <p className="text-[11px] text-muted-foreground">Moon</p>
            {moonPhase && (
              <div className="flex items-center gap-1">
                <MoonPhaseSymbol phase={moonPhase} className="w-4 h-4" />
                <span className="text-sm font-semibold">{moonPhase.illumination}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{location}</p>
        </div>
      </Card>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {items.map((item) => (
          <Link key={item.key} to={item.to}>
            <Card className="p-4 space-y-3 hover:shadow-md transition-shadow h-full">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tintClasses[item.tint]}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{descriptions[item.key] || "—"}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Next Bite Window & Fishing Rating */}
      {biteWindow && moonPhase && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Next Bite Window</p>
              <p className="font-heading font-semibold">{biteWindow.start} – {biteWindow.end}</p>
              <p className={`text-xs font-medium ${
                moonPhase.fishingRating >= 5 ? "text-green-600" : "text-yellow-600"
              }`}>
                {moonPhase.fishingRating >= 7 ? "Excellent" :
                 moonPhase.fishingRating >= 6 ? "Very Good" :
                 moonPhase.fishingRating >= 5 ? "Good" : "Fair"} fishing
              </p>
            </div>
            <FishIcon className="w-8 h-8 text-primary" />
          </div>
        </Card>
      )}

      {/* Alarms */}
      {getAlarmTimes().length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Active Alarms</p>
              <p className="text-sm font-semibold">{getAlarmTimes().join(", ")}</p>
            </div>
          </div>
        </Card>
      )}

      <FeaturedImage />
    </div>
  );
}