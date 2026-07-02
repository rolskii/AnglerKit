import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, MapPin, ChevronDown } from 'lucide-react';

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
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=${unit}&wind_speed_unit=mph&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&forecast_days=10`
      );
      const data = await response.json();
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
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent('Toronto')}&language=en&count=1&format=json`
      );
      const geoData = await geoResponse.json();
      if (!geoData.results?.[0]) throw new Error('Location not found');
      const result = geoData.results[0];
      const lat = result.latitude;
      const lon = result.longitude;
      const locationName = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}`;
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=${tempUnit}&wind_speed_unit=mph&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&forecast_days=10`
      );
      const data = await response.json();
      const coords = { lat, lon, name: locationName };
      setLastCoords(coords);
      saveLocation(coords, locationName);
      setLocation(locationName);
      setEditingLocation(locationName);
      setWeather({ current: data.current, daily: data.daily, hourly: data.hourly });
      setLoading(false);
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
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&language=en&count=10&format=json`
      );
      const data = await response.json();
      if (data.results) {
        const ref = userCoords || lastCoords;
        const mapped = data.results.map(r => ({
          label: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`,
          lat: r.latitude,
          lon: r.longitude,
          name: `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}`,
          distance: ref ? calculateDistance(ref.lat, ref.lon, r.latitude, r.longitude) : null,
        }));
        if (ref) mapped.sort((a, b) => a.distance - b.distance);
        setSuggestions(mapped);
        setShowSuggestions(true);
      }
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
      const lat = result.latitude;
      const lon = result.longitude;
      const locationName = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}`;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=${tempUnit}&wind_speed_unit=mph&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m&forecast_days=10`
      );
      const data = await response.json();
      const coords = { lat, lon, name: locationName };
      setLastCoords(coords);
      saveLocation(coords, locationName);
      setLocation(locationName);
      setEditingLocation(locationName);
      setShowSuggestions(false);
      setWeather({
        current: data.current,
        daily: data.daily,
        hourly: data.hourly,
      });
      setError(null);
      setLoading(false);
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

  const getWeatherIcon = (code) => {
    if (code === 0 || code === 1) return Sun;
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
    <div className="min-h-screen bg-background px-4 pb-20 pt-0">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold">Weather</h1>
            <button
              onClick={toggleTempUnit}
              className="px-3 py-1 text-sm font-medium rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
              title="Toggle temperature unit"
            >
              °{tempUnit === 'fahrenheit' ? 'F' : 'C'}
            </button>
          </div>
          <p className="text-muted-foreground">Check current weather conditions and 7-day forecast for your fishing location.</p>
        </div>

        {/* Location Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Location</label>
              <div className="flex gap-2 flex-col sm:flex-row">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={editingLocation}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    placeholder="Enter city, state or coordinates"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                    onKeyPress={(e) => e.key === 'Enter' && handleLocationChange()}
                    onFocus={(e) => {
                      e.target.select();
                      editingLocation.trim().length >= 2 && setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto" onMouseDown={(e) => e.preventDefault()}>
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
                <button
                  onClick={fetchUserLocation}
                  className="px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  title="Refresh current location"
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
              {location && (
                <p className="text-xs text-muted-foreground">Currently showing: {location}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Weather Card */}
        <Card className="bg-primary/10">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Temperature and Condition */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-5xl font-bold text-primary">{Math.round(current.temperature_2m)}°</p>
                  <p className="text-muted-foreground mt-1">{getWeatherDescription(current.weather_code)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Feels like {Math.round(current.apparent_temperature)}°</p>
                </div>
                <div className="flex items-center justify-center">
                  <WeatherIcon className="w-24 h-24 text-primary" />
                </div>
              </div>

              {/* Conditions Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Droplets className="w-4 h-4" />
                    Humidity
                  </div>
                  <p className="text-lg font-semibold">{current.relative_humidity_2m}%</p>
                </div>
                <div className="bg-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Wind className="w-4 h-4" />
                    Wind Speed
                  </div>
                  <p className="text-lg font-semibold">
                    {tempUnit === 'fahrenheit' ? Math.round(current.wind_speed_10m) + ' mph' : Math.round(current.wind_speed_10m * 1.60934) + ' km/h'}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Eye className="w-4 h-4" />
                    Visibility
                  </div>
                  <p className="text-lg font-semibold">
                    {tempUnit === 'fahrenheit' ? (current.visibility / 1000).toFixed(1) + ' mi' : (current.visibility / 1000).toFixed(1) + ' km'}
                  </p>
                </div>
                <div className="bg-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CloudRain className="w-4 h-4" />
                    Precipitation
                  </div>
                  <p className="text-lg font-semibold">
                    {tempUnit === 'fahrenheit' ? current.precipitation.toFixed(2) + '"' : (current.precipitation * 25.4).toFixed(1) + ' mm'}
                  </p>
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

        {/* Fishing Tip */}
        <Card className="bg-secondary/30">
          <CardHeader>
            <CardTitle className="text-base">Fishing Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {current.precipitation > 0.1 && (
              <p>✓ Rain in the forecast — fish are often more active before and after rainfall</p>
            )}
            {current.wind_speed_10m < 5 && (
              <p>✓ Light winds — ideal for sight fishing and surface presentations</p>
            )}
            {current.wind_speed_10m >= 10 && (
              <p>✓ Strong winds — try heavier flies and lures, fish may be deeper</p>
            )}
            {current.relative_humidity_2m > 70 && (
              <p>✓ High humidity — great for insect activity and hatches</p>
            )}
            {((tempUnit === 'fahrenheit' && current.temperature_2m > 70 && current.temperature_2m < 85) ||
              (tempUnit === 'celsius' && current.temperature_2m > 21 && current.temperature_2m < 29)) && (
              <p>✓ Optimal temperature range for most freshwater species</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}