import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Camera, Moon as MoonIcon, Cloud, Bell, MapPin, ChevronDown, Map as MapIcon, Waves, Gauge, Package } from "lucide-react";
import WeatherGlyph from "@/components/weather/WeatherGlyph";
import { ReelIcon as ReelDiscIcon, LinesIcon, RodIcon, LureIcon } from "@/components/GearIcons";
import FishIcon from "@/components/FishIcon";
import MoonPhaseSymbol from "@/components/MoonPhaseSymbol";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import FeaturedImage from "@/components/FeaturedImage";
import LocationMapPicker from "@/components/moon/LocationMapPicker";
import { getSharedLocation, setSharedLocation, initDefaultLocationFromGPS } from "@/lib/sharedLocation";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";
import RadioAccessButton from "@/components/radio/RadioAccessButton";
import RadioPanel from "@/components/radio/RadioPanel";
import RadioPlayerBar from "@/components/radio/RadioPlayerBar";
const calculateMoonPhase = (date) => {
  const knownNewMoon = new Date(2000, 0, 6);
  const lunarMonth = 29.53058867;
  const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const daysInCycle = daysSinceNewMoon % lunarMonth;
  const illumination = (1 - Math.cos(Math.PI * 2 * (daysInCycle / lunarMonth))) / 2;
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
  { title: "Gear", icon: ReelDiscIcon, tint: "orange", key: "gear" },
  { title: "Conditions", icon: Gauge, tint: "gauge", key: "conditions" },
  { to: "/map", title: "Map", icon: MapIcon, tint: "green", key: "map" },
  { to: "/catches", title: "Fish Log", icon: Camera, tint: "blue", key: "catch" },
];
const CONDITIONS_ITEMS = [
  { to: "/moon", label: "Moon", icon: MoonIcon, tint: "purple" },
  { to: "/river", label: "Hydrometric", icon: Waves, tint: "cyan" },
  { to: "/weather", label: "Weather", icon: Cloud, tint: "teal" },
];
const GEAR_ITEMS = [
  { to: "/lines", label: "Lines", icon: LinesIcon, tint: "blue" },
  { to: "/reels", label: "Reels", icon: ReelDiscIcon, tint: "orange" },
  { to: "/rods", label: "Rods", icon: RodIcon, tint: "teal" },
  { to: "/lures", label: "Tackle", icon: LureIcon, tint: "purple" },
  { to: "/misc", label: "Misc. Gear", icon: Package, tint: "orange" },
];
const tintClasses = {
  orange: "bg-tint-orange-bg text-tint-orange",
  blue: "bg-tint-blue-bg text-tint-blue",
  purple: "bg-tint-purple-bg text-tint-purple",
  teal: "bg-tint-teal-bg text-tint-teal",
  cyan: "bg-cyan-100 text-cyan-600",
  green: "bg-green-100 text-green-600",
  gauge: "bg-blue-100 text-blue-700",
};
export default function Home() {
  const navigate = useNavigate();
  const [moonPhase, setMoonPhase] = useState(null);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [descriptions, setDescriptions] = useState({});
  const [biteWindow, setBiteWindow] = useState(null);
  const [alarmTick, setAlarmTick] = useState(0);
  const shared = getSharedLocation();
  const [location, setLocation] = useState(shared.name);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [coords, setCoords] = useState(shared.coords);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const [radioOpen, setRadioOpen] = useState(false);
  const radio = useRadioPlayer();
  const conditionsPopupRef = useRef(null);
  const conditionsButtonRef = useRef(null);
  const gearPopupRef = useRef(null);
  const gearButtonRef = useRef(null);
  useEffect(() => {
    if (!conditionsOpen && !gearOpen) return undefined;
    function handleOutside(event) {
      if (conditionsOpen) {
        if (conditionsPopupRef.current?.contains(event.target)) return;
        if (conditionsButtonRef.current?.contains(event.target)) return;
      }
      if (gearOpen) {
        if (gearPopupRef.current?.contains(event.target)) return;
        if (gearButtonRef.current?.contains(event.target)) return;
      }
      setConditionsOpen(false);
      setGearOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [conditionsOpen, gearOpen]);
  const handleSelectCondition = (to) => {
    setConditionsOpen(false);
    navigate(to);
  };
  const handleSelectGear = (to) => {
    setGearOpen(false);
    navigate(to);
  };
  const toggleConditions = () => {
    setGearOpen(false);
    setConditionsOpen((open) => !open);
  };
  const toggleGear = () => {
    setConditionsOpen(false);
    setGearOpen((open) => !open);
  };
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
    await initDefaultLocationFromGPS();
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const phase = calculateMoonPhase(midnight);
    setMoonPhase(phase);
    setBiteWindow(getNextBiteWindow());
    const sharedLoc = getSharedLocation();
    setLocation(sharedLoc.name);
    setCoords(sharedLoc.coords);
    setDescriptions(prev => ({ ...prev, moon: `${phase.illumination}% illuminated` }));
    setAlarmTick(t => t + 1);
    const coords = sharedLoc.coords;
    const tempUnit = localStorage.getItem("weatherTempUnit") || "celsius";
    await fetchWeather(coords, tempUnit);
    await Promise.all([fetchGearCount(), fetchLastCatch(), fetchMapStats()]);
    // Pick a new featured photo on manual refresh
    localStorage.removeItem("featuredImageDaily");
    window.dispatchEvent(new Event("featured-image-changed"));
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
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await base44.functions.invoke('ecweather', { lat: coords.lat, lon: coords.lon, unit: tempUnit, localDate: todayStr(), tzOffset: new Date().getTimezoneOffset() });
        const data = res.data;
        const tempC = data.current.temperature_2m;
        const temp = tempUnit === "fahrenheit" ? Math.round(tempC * 9 / 5 + 32) : Math.round(tempC);
        const desc = getWeatherDescription(data.current.weather_code);
        const wind = data.current.wind_speed_10m;
        const windLabel = wind < 8 ? "Light wind" : wind < 15 ? "Breezy" : "Windy";
        const tempSymbol = tempUnit === "fahrenheit" ? "°F" : "°C";
        const code = data.current.weather_code;
        const now = new Date();
        let isNight = false;
        if (data.daily?.sunrise?.[0] && data.daily?.sunset?.[0]) {
          const sunrise = new Date(data.daily.sunrise[0]);
          const sunset = new Date(data.daily.sunset[0]);
          isNight = now < sunrise || now >= sunset;
        }
        setWeatherInfo({ temp: `${temp}${tempSymbol}`, windLabel, desc, code, isNight });
        setDescriptions(prev => ({ ...prev, weather: desc }));
        return;
      } catch (e) {
        if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
      }
    }
  };
  const selectLocationFromMap = async (name, lat, lon) => {
    setSharedLocation(name, lat, lon);
    const newCoords = { lat, lon, name };
    setLocation(name);
    setCoords(newCoords);
    setLocationDialogOpen(false);
    const tempUnit = localStorage.getItem("weatherTempUnit") || "celsius";
    await fetchWeather(newCoords, tempUnit);
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
      const tackleCount = lures.length + misc.length;
      setDescriptions(prev => ({
        ...prev,
        gear: [
          `${lines.length} ${lines.length === 1 ? "line" : "lines"}`,
          `${reels.length} ${reels.length === 1 ? "reel" : "reels"}`,
          `${rods.length} ${rods.length === 1 ? "rod" : "rods"}`,
          `${tackleCount} ${tackleCount === 1 ? "tackle" : "tackle"}`,
        ]
      }));
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
  const fetchMapStats = async () => {
    try {
      const routes = await base44.entities.MapCourse.list("-updated_date", 500);
      const routesWithTrack = routes.filter(r => r.track && r.track.length > 0);
      const routeCount = routesWithTrack.length;
      let totalPins = routes.reduce((sum, r) => sum + (r.pins?.length || 0), 0);
      let totalDrawings = routes.reduce((sum, r) => sum + (r.drawings?.length || 0), 0);
      let totalMeasurements = routes.reduce((sum, r) => sum + (r.measurements?.length || 0), 0);
      setDescriptions(prev => ({
        ...prev,
        map: [
          `${routeCount} ${routeCount === 1 ? "route" : "routes"}`,
          `${totalPins} ${totalPins === 1 ? "pin" : "pins"}`,
          `${totalDrawings} dwg.`,
          `${totalMeasurements} meas.`
        ]
      }));
    } catch (e) {}
  };
  return (
    <PullToRefresh onRefresh={refreshData}>
    <div className="space-y-3 md:space-y-4 -mt-4 md:-mt-8">
      {/* Hero */}
      <div className="space-y-2 px-1">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight">AnglerKit</h1>
          <RadioAccessButton active={radio.current && radio.playing} onClick={() => setRadioOpen(true)} className="mt-1" />
        </div>
        <p className="text-sm md:text-[17px] text-muted-foreground">
          Track your fishing gear, predict the bite, check the weather and log every catch — all in one place.
        </p>
      </div>
      {/* Status bar */}
      {moonPhase && (
        <div className="px-4 pt-3 pb-0.5 rounded-2xl bg-card shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-foreground">Fish Bite Rating:<span className={`ml-4 ${moonPhase.fishingRating >= 5 ? "text-green-600" : moonPhase.fishingRating <= 3 ? "text-yellow-600" : "text-primary"}`}>{Math.round((moonPhase.fishingRating / 7) * 100)}%</span><span className={`ml-2 text-sm font-bold ${moonPhase.fishingRating >= 5 ? "text-green-600" : moonPhase.fishingRating <= 3 ? "text-yellow-600" : "text-primary"}`}>{moonPhase.fishingRating <= 2 ? "Bad" : moonPhase.fishingRating === 3 ? "Fair" : moonPhase.fishingRating === 4 ? "OK" : moonPhase.fishingRating === 5 ? "Good" : moonPhase.fishingRating === 6 ? "Very Good" : "Excellent"}</span></p>
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
              <p className="text-xs font-semibold text-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="mt-1 relative z-20 flex justify-end">
                <button
                  type="button"
                  onClick={() => setLocationDialogOpen(true)}
                  className="text-xs text-muted-foreground flex items-center gap-0.5 hover:text-foreground transition-colors py-1 px-1 -mr-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">{location}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Major</p>
              <p className="text-xs text-foreground flex items-center gap-1">
                <span className="whitespace-nowrap">5:48–7:48 AM</span>
                {getAlarmTimes().includes("5:48 AM") && <Bell className="w-3 h-3 text-primary" />}
              </p>
              <p className="text-xs text-foreground flex items-center gap-1">
                <span className="whitespace-nowrap">8:54–10:54 PM</span>
                {getAlarmTimes().includes("8:54 PM") && <Bell className="w-3 h-3 text-primary" />}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Minor</p>
              <p className="text-xs text-foreground">5:48–6:18 AM</p>
              <p className="text-xs text-foreground">8:54–9:24 PM</p>
            </div>
            <div className="flex items-center justify-end">
              {moonPhase && <MoonPhaseSymbol phase={moonPhase} className="w-12 h-12" />}
            </div>
            <div className="flex items-center justify-end pr-2">
              {weatherInfo && (
                <WeatherGlyph code={weatherInfo.code} isNight={weatherInfo.isNight} animated className="w-14 h-14" />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Category grid */}
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isGear = item.key === "gear";
          const isConditions = item.key === "conditions";
          const desc = descriptions[item.key];
          const cardInner = (
            <div className="flex flex-col gap-1 md:gap-3">
              <div className={`flex h-7 w-7 md:h-11 md:w-11 items-center justify-center rounded-xl flex-shrink-0 ${tintClasses[item.tint]}`}>
                <Icon className={isGear ? "w-5 md:w-10 h-5 md:h-10" : "w-4 md:w-8 h-4 md:h-8"} strokeWidth={2} />
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <h2 className="text-[12.5px] md:text-[22.5px] font-heading font-semibold tracking-tight leading-tight">{item.title}</h2>
                {isConditions ? (
                  <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">Moon · Hydrometric · Weather</p>
                ) : Array.isArray(desc) ? (
                  <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">{desc.join(", ")}</p>
                ) : desc ? (
                  <p className="text-[10px] md:text-sm text-muted-foreground leading-tight">{desc}</p>
                ) : (
                  <p className="text-[10px] md:text-sm text-muted-foreground/40">—</p>
                )}
              </div>
            </div>
          );
          if (isGear) {
            return (
              <div key={item.key} className="relative h-full">
                {gearOpen && (
                  <div
                    ref={gearPopupRef}
                    className="absolute top-full mt-2 left-0 w-[160px] bg-card rounded-2xl shadow-xl border border-border/60 p-1.5 z-20"
                  >
                    <div className="absolute -top-1.5 left-6 w-3 h-3 bg-card border-l border-t border-border/60 rotate-45" />
                    {GEAR_ITEMS.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.to}
                          type="button"
                          onClick={() => handleSelectGear(sub.to)}
                          className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-accent active:bg-accent transition-colors text-left"
                        >
                          <span className={`flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 ${tintClasses[sub.tint]}`}>
                            <SubIcon className="w-4 h-4" strokeWidth={2} />
                          </span>
                          <span className="text-sm font-semibold text-foreground">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  ref={gearButtonRef}
                  type="button"
                  onClick={toggleGear}
                  className="group block w-full h-full text-left"
                >
                  <Card className="relative p-1.5 md:p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
                    {cardInner}
                  </Card>
                </button>
              </div>
            );
          }
          if (isConditions) {
            return (
              <div key={item.key} className="relative h-full">
                {conditionsOpen && (
                  <div
                    ref={conditionsPopupRef}
                    className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[160px] bg-card rounded-2xl shadow-xl border border-border/60 p-1.5 z-20"
                  >
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-l border-t border-border/60 rotate-45" />
                    {CONDITIONS_ITEMS.map((sub) => {
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.to}
                          type="button"
                          onClick={() => handleSelectCondition(sub.to)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-accent active:bg-accent transition-colors text-left"
                        >
                          <span className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${tintClasses[sub.tint]}`}>
                            <SubIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                          </span>
                          <span className="text-sm font-semibold text-foreground">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  ref={conditionsButtonRef}
                  type="button"
                  onClick={toggleConditions}
                  className="group block w-full h-full text-left"
                >
                  <Card className="relative p-1.5 md:p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
                    {cardInner}
                  </Card>
                </button>
              </div>
            );
          }
          return (
            <Link key={item.key} to={item.to} className="group block h-full">
              <Card className="relative p-1.5 md:p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
                {cardInner}
              </Card>
            </Link>
          );
        })}
      </div>
      <FeaturedImage />
      <LocationMapPicker
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        initialCoords={coords}
        onSelect={selectLocationFromMap}
      />
      <RadioPanel open={radioOpen} onClose={() => setRadioOpen(false)} player={radio} />
      <RadioPlayerBar player={radio} />
      </div>
      </PullToRefresh>
      );
      }