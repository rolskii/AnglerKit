import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Moon, Wind, Droplets, Gauge, TrendingUp, TrendingDown, MapPin, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchLocations, geocodeLocation } from '@/lib/geocode';
import LocationMapPicker from '@/components/moon/LocationMapPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import HourlyConditionsCard from '@/components/weather/HourlyConditionsCard';
import DayForecastDialog from '@/components/weather/DayForecastDialog';

export default function Weather() {
  const savedLocation = localStorage.getItem('weatherLocation');
  const savedCoords = localStorage.getItem('weatherCoords');
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(savedLocation || 'Toronto, ON');
  const [editingLocation, setEditingLocation] = useState(savedLocation || 'Toronto, ON');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem('weatherTempUnit') || 'celsius');
  const [lastCoords, setLastCoords] = useState(savedCoords ? JSON.parse(savedCoords) : null);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const todayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleMapSelect = (name, lat, lon) => {
    fetchWeatherByCoords(lat, lon, name, tempUnit);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const saveLocation = (coords, locationName) => {
    localStorage.setItem('weatherLocation', locationName);
    localStorage.setItem('weatherCoords', JSON.stringify(coords));
  };

  const fetchWeatherByCoords = async (lat, lon, locationName, unit = tempUnit) => {
    if (!lat || !lon) return;
    try {
      setLoading(true);
      setError(null);
      const res = await base44.functions.invoke('weatherkit', { lat, lon, unit });
      const data = res.data;
      const coords = { lat, lon, name: locationName };
      setLastCoords(coords);
      saveLocation(coords, locationName);
      setLocation(locationName);
      setEditingLocation(locationName);
      setShowSuggestions(false);
      setWeather({ current: data.current, daily: data.daily, hourly: data.hourly });
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch weather for that location.');
      setLoading(false);
    }
  };

  const fetchUserLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await geocodeLocation('Toronto');
      if (!result) throw new Error('Location not found');
      await fetchWeatherByCoords(result.lat, result.lon, result.name, tempUnit);
    } catch (err) {
      setError('Unable to fetch weather. Please try updating location manually.');
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
      const results = await searchLocations(value, 10);
      const ref = userCoords || lastCoords;
      const mapped = results.map(r => ({
        label: r.name,
        lat: r.lat,
        lon: r.lon,
        name: r.name,
        distance: ref ? calculateDistance(ref.lat, ref.lon, r.lat, r.lon) : null,
      }));
      if (ref) mapped.sort((a, b) => a.distance - b.distance);
      setSuggestions(mapped);
      setShowSuggestions(true);
    } catch (err) {
      setSuggestions([]);
    }
  };

  const toggleTempUnit = () => {
    const next = tempUnit === 'fahrenheit' ? 'celsius' : 'fahrenheit';
    setTempUnit(next);
    localStorage.setItem('weatherTempUnit', next);
    if (lastCoords) {
      fetchWeatherByCoords(lastCoords.lat, lastCoords.lon, lastCoords.name, next);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setEditingLocation(suggestion.label);
    setShowSuggestions(false);
    setSuggestions([]);
    fetchWeatherByCoords(suggestion.lat, suggestion.lon, suggestion.name);
  };

  const handleLocationChange = async (overrideLocation) => {
    const loc = (typeof overrideLocation === 'string' && overrideLocation) || editingLocation;
    if (!loc || !loc.trim()) return;

    // If the location text hasn't changed and we already have coords, refetch directly
    if (lastCoords && loc.trim() === location) {
      fetchWeatherByCoords(lastCoords.lat, lastCoords.lon, lastCoords.name || loc);
      return;
    }

    try {
      setLoading(true);
      const result = await geocodeLocation(loc);
      if (!result) {
        setError('Location not found. Please try another search.');
        setLoading(false);
        return;
      }
      await fetchWeatherByCoords(result.lat, result.lon, result.name, tempUnit);
      setError(null);
    } catch (err) {
      setError('Failed to fetch weather for that location.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
    if (lastCoords) {
      fetchWeatherByCoords(lastCoords.lat, lastCoords.lon, lastCoords.name || location);
    } else {
      fetchUserLocation();
    }
  }, []);

  const getWeatherDescription = (code) => {
    const codes = {
      0: 'Clear',
      1: 'Mostly Clear',
      2: 'Partly Cloudy',
      3: 'Cloudy',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light Drizzle',
      53: 'Drizzle',
      55: 'Heavy Drizzle',
      61: 'Light Rain',
      63: 'Rain',
      65: 'Heavy Rain',
      71: 'Light Snow',
      73: 'Snow',
      75: 'Heavy Snow',
      80: 'Light Showers',
      81: 'Showers',
      82: 'Heavy Showers',
      85: 'Light Snow Showers',
      86: 'Snow Showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with Hail',
      99: 'Thunderstorm with Hail',
    };
    return codes[code] || 'Unknown';
  };

  const isNight = () => {
    if (!weather?.daily?.sunrise?.[0] || !weather?.daily?.sunset?.[0]) return false;
    const now = new Date();
    const sunrise = new Date(weather.daily.sunrise[0]);
    const sunset = new Date(weather.daily.sunset[0]);
    return now < sunrise || now > sunset;
  };

  const getWeatherIcon = (code) => {
    const night = isNight();
    if (code === 0 || code === 1) return night ? Moon : Sun;
    if (code === 2 || code === 3) return Cloud;
    if (code >= 51 && code <= 99) return CloudRain;
    return Cloud;
  };

  const getDailySummary = () => {
    if (!daily) return null;
    const dayIdx = daily.time.indexOf(selectedDate);
    if (dayIdx === -1) return null;
    const code = daily.weather_code[dayIdx];
    const maxTemp = Math.round(daily.temperature_2m_max[dayIdx]);
    const minTemp = Math.round(daily.temperature_2m_min[dayIdx]);
    const precipProb = daily.precipitation_probability?.[dayIdx] ?? 0;
    const desc = getWeatherDescription(code);

    let summary = `${desc} with highs near ${maxTemp}° and lows around ${minTemp}°.`;
    if (precipProb >= 60) summary += ` High chance of precipitation (${precipProb}%).`;
    else if (precipProb >= 30) summary += ` Possible precipitation (${precipProb}%).`;
    else summary += ` Low chance of rain (${precipProb}%).`;
    return summary;
  };

  const getWeatherIconColor = (code) => {
    const night = isNight();
    if (code === 0 || code === 1) return night ? 'text-indigo-300' : 'text-yellow-500';
    if (code === 2 || code === 3) return night ? 'text-indigo-300' : 'text-sky-400';
    return 'text-blue-500';
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

  if (!weather) return null;

  const current = weather.current;
  const daily = weather.daily;
  const WeatherIcon = getWeatherIcon(current.weather_code);
  const weatherIconColor = getWeatherIconColor(current.weather_code);

  return (
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2 px-1 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight">Weather</h1>
            <button
              onClick={toggleTempUnit}
              className="px-3 py-1 text-sm font-medium rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
              title="Toggle temperature unit"
            >
              °{tempUnit === 'fahrenheit' ? 'F' : 'C'}
            </button>
          </div>
        </div>

        {/* Current Weather Card */}
        <Card className="bg-primary/10">
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Temperature and Condition */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-stretch gap-3">
                  <p className="text-6xl font-bold text-primary leading-none self-center">{Math.round(current.temperature_2m)}°</p>
                  <div className="flex flex-col justify-center">
                    <p className="text-muted-foreground text-sm leading-tight">{getWeatherDescription(current.weather_code)}</p>
                    <p className="text-xs text-muted-foreground leading-tight">Feels like {Math.round(current.apparent_temperature)}°</p>
                    <p className="text-xs text-muted-foreground leading-tight">H: {Math.round(daily.temperature_2m_max[0])}°  L: {Math.round(daily.temperature_2m_min[0])}°</p>
                  </div>
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <WeatherIcon className={`w-20 h-20 ${weatherIconColor}`} />
                </div>
                {/* Date and Location */}
                <div className="flex flex-col items-end gap-1 z-10">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline transition-colors">
                        {formatDate(selectedDate)}
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
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
                      />
                    </PopoverContent>
                  </Popover>
                  <button
                    onClick={() => setMapPickerOpen(true)}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{location}</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>
                </div>
              </div>

              {/* Conditions Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-card p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Droplets className="w-3.5 h-3.5" />
                    Humidity
                  </div>
                  <p className="text-base font-semibold">{current.relative_humidity_2m}%</p>
                </div>
                <div className="bg-card p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Wind className="w-3.5 h-3.5" />
                    Wind
                  </div>
                  <p className="text-base font-semibold">
                    {tempUnit === 'fahrenheit' ? Math.round(current.wind_speed_10m) + ' mph' : Math.round(current.wind_speed_10m * 1.60934) + ' km/h'}
                  </p>
                </div>
                <div className="bg-card p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <CloudRain className="w-3.5 h-3.5" />
                    Precip
                  </div>
                  <p className="text-base font-semibold">
                    {tempUnit === 'fahrenheit' ? current.precipitation.toFixed(2) + '"' : (current.precipitation * 25.4).toFixed(1) + ' mm'}
                  </p>
                </div>
                <div className="bg-card p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Gauge className="w-3.5 h-3.5" />
                    Pressure
                  </div>
                  <p className="text-base font-semibold">{(current.pressure / 10).toFixed(1)} kPa</p>
                </div>
              </div>

              {/* Daily Summary */}
              {getDailySummary() && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">{getDailySummary()}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Conditions for Selected Date */}
        <HourlyConditionsCard
          hourly={weather.hourly}
          selectedDate={selectedDate}
          daily={daily}
        />

        {/* 10-Day Forecast */}
        <Card>
          <CardHeader className="pt-3 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">10-Day Forecast</CardTitle>
            <CardDescription>Tap a day for details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {daily.time.map((date, idx) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (new Date(date) <= today) return null;
                const ForecastIcon = getWeatherIcon(daily.weather_code[idx]);
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDay({ date, idx, daily });
                      setDayDialogOpen(true);
                    }}
                    className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-secondary/40 hover:bg-primary/10 transition-colors aspect-square justify-center"
                  >
                    <p className="text-xs font-medium text-foreground truncate w-full text-center">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <ForecastIcon className="w-7 h-7 text-primary" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{Math.round(daily.temperature_2m_max[idx])}°</span>
                      <span className="text-xs text-muted-foreground">{Math.round(daily.temperature_2m_min[idx])}°</span>
                    </div>
                    {daily.precipitation_probability?.[idx] > 0 && (
                      <p className="text-[10px] text-primary flex items-center gap-0.5">
                        <Droplets className="w-2.5 h-2.5" />
                        {daily.precipitation_probability[idx]}%
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>


      </div>

      <LocationMapPicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialCoords={lastCoords}
        onSelect={handleMapSelect}
      />

      <DayForecastDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        dayData={selectedDay}
        hourly={weather?.hourly}
        tempUnit={tempUnit}
      />
    </div>
  );
}