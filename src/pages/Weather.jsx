import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Moon, Wind, Droplets, Gauge, TrendingUp, TrendingDown, MapPin, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchLocations, geocodeLocation } from '@/lib/geocode';
import LocationMapPicker from '@/components/moon/LocationMapPicker';

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
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

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
            <button
              onClick={() => setMapPickerOpen(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors mb-2"
            >
              <MapPin className="w-4 h-4" />
              {location}
            </button>
            <div className="space-y-3">
              {/* Temperature and Condition */}
              <div className="flex items-center justify-between">
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-bold text-primary leading-tight">{Math.round(current.temperature_2m)}°</p>
                  <div className="pb-1">
                    <p className="text-muted-foreground text-sm leading-tight">{getWeatherDescription(current.weather_code)}</p>
                    <p className="text-xs text-muted-foreground leading-tight">Feels like {Math.round(current.apparent_temperature)}°</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <WeatherIcon className="w-16 h-16 text-primary" />
                </div>
              </div>

              {/* Conditions Grid */}
              <div className="grid grid-cols-3 gap-3">
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
                  <p className="text-base font-semibold">{Math.round(current.pressure)} hPa</p>
                </div>
                <div className="bg-card p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    High
                  </div>
                  <p className="text-base font-semibold">{Math.round(daily.temperature_2m_max[0])}°</p>
                </div>
                <div className="bg-card p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Low
                  </div>
                  <p className="text-base font-semibold">{Math.round(daily.temperature_2m_min[0])}°</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 10-Day Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">10-Day Forecast</CardTitle>
            <CardDescription>Daily high and low temperatures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {daily.time.map((date, idx) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (new Date(date) < today) return null;
                const ForecastIcon = getWeatherIcon(daily.weather_code[idx]);
                return (
                  <div key={idx}>
                    <button
                      onClick={() => setSelectedDay(selectedDay === date ? null : date)}
                      className="w-full flex items-center justify-between p-3 bg-card rounded-lg hover:bg-primary/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <ForecastIcon className="w-6 h-6 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-xs text-muted-foreground">{getWeatherDescription(daily.weather_code[idx])}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{Math.round(daily.temperature_2m_max[idx])}°</p>
                          <p className="text-xs text-muted-foreground">{Math.round(daily.temperature_2m_min[idx])}°</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${selectedDay === date ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {selectedDay === date && weather.hourly && (
                      <div className="mt-2 pb-2 overflow-x-auto">
                        <div className="flex gap-3 px-1 min-w-max">
                          {weather.hourly.time
                            .map((hTime, hIdx) => ({ hTime, hIdx }))
                            .filter(({ hTime }) => hTime.startsWith(date))
                            .map(({ hTime, hIdx }) => {
                              const HourIcon = getWeatherIcon(weather.hourly.weather_code[hIdx]);
                              const hourLabel = new Date(hTime).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                              return (
                                <div key={hIdx} className="flex flex-col items-center gap-1.5 w-16 p-2 rounded-lg bg-secondary/40">
                                  <p className="text-xs text-muted-foreground">{hourLabel}</p>
                                  <HourIcon className="w-6 h-6 text-primary" />
                                  <p className="text-sm font-semibold">{Math.round(weather.hourly.temperature_2m[hIdx])}°</p>
                                  <p className="text-xs text-primary flex items-center gap-0.5">
                                    <Droplets className="w-3 h-3" />
                                    {weather.hourly.precipitation_probability[hIdx]}%
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
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
    </div>
  );
}