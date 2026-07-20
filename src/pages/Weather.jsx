import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Droplets, Wind, Eye, MapPin, Gauge, Thermometer } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import WeatherGlyph from '@/components/weather/WeatherGlyph';
import AirQualityCard from '@/components/weather/AirQualityCard';
import AlertColorSymbols from '@/components/weather/AlertColorSymbols';
import HourlyConditionsCard from '@/components/weather/HourlyConditionsCard';
import DayForecastDialog from '@/components/weather/DayForecastDialog';
import { formatTemp, formatWind, formatPressure } from '@/lib/weatherUnits';

// ecweather always returns metric values (°C, km/h, km) regardless of the
// `unit` param it's given — that param only controls the wording of EC's
// prose forecast text. formatTemp/formatWind/formatPressure (from
// @/lib/weatherUnits) do the display-time conversion, so the raw metric
// payload is kept as-is here rather than pre-converted.
const kmToMi = (km) => km * 0.621371;

const getWeatherDescription = (code) => {
  const codes = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
    45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle',
    55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
    80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Light Snow Showers', 86: 'Snow Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Thunderstorm with Hail',
  };
  return codes[code] || 'Unknown';
};

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
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem('weatherTempUnit') || 'fahrenheit');
  const [lastCoords, setLastCoords] = useState(savedCoords ? JSON.parse(savedCoords) : null);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dayDialogData, setDayDialogData] = useState(null);

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

  // EC-primary-for-Canada / WeatherKit-elsewhere, via the ecweather backend
  // function. The response is kept in raw metric units — formatTemp/
  // formatWind/formatPressure/formatVisibility (from @/lib/weatherUnits)
  // convert for display based on tempUnit.
  const fetchEcWeather = async (lat, lon, unit) => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tzOffset = now.getTimezoneOffset();
    const res = await base44.functions.invoke('ecweather', { lat, lon, localDate, tzOffset, unit });
    const data = res?.data;
    if (!data || data.error) {
      throw new Error(data?.error || 'Failed to fetch weather data.');
    }
    return data;
  };

  const fetchWeatherByCoords = async (lat, lon, locationName, unit = tempUnit) => {
    if (!lat || !lon) return;
    try {
      setLoading(true);
      setError(null);
      const weatherData = await fetchEcWeather(lat, lon, unit);
      const coords = { lat, lon, name: locationName };
      setLastCoords(coords);
      saveLocation(coords, locationName);
      setLocation(locationName);
      setEditingLocation(locationName);
      setShowSuggestions(false);
      setWeather(weatherData);
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

      await fetchWeatherByCoords(lat, lon, locationName);
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

      await fetchWeatherByCoords(lat, lon, locationName);
      setShowSuggestions(false);
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

  const openDayDialog = (date, idx) => {
    setDayDialogData({ date, idx, daily: weather.daily });
    setDayDialogOpen(true);
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
  const hourly = weather.hourly;

  const futureDays = daily.time
    .map((date, idx) => ({ date, idx }))
    .filter(({ date }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(date + 'T00:00:00') >= today;
    });

  const weekMax = Math.max(...futureDays.map(({ idx }) => daily.temperature_2m_max[idx]));
  const weekMin = Math.min(...futureDays.map(({ idx }) => daily.temperature_2m_min[idx]));
  const weekSpan = Math.max(1, weekMax - weekMin);

  const dailySummary = daily.text_summary?.[0] || daily.night_text_summary?.[0] || null;

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-4">
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
          <p className="text-muted-foreground text-sm">Current conditions and forecast for your fishing location.</p>
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLocationChange()}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Update
                  </button>
                  <button
                    onClick={fetchUserLocation}
                    className="px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    title="Refresh current location"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {location && (
                <p className="text-xs text-muted-foreground">Currently showing: {location}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <AlertColorSymbols alerts={weather.alerts} />

        {/* Current Weather Card */}
        <Card className="bg-primary/10">
          <CardContent className="pt-6 space-y-4">
            {/* Temperature and Condition */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold text-primary">{formatTemp(current.temperature_2m, tempUnit)}°</p>
                <p className="text-muted-foreground mt-1">{current.condition || getWeatherDescription(current.weather_code)}</p>
                <p className="text-xs text-muted-foreground mt-1">Feels like {formatTemp(current.apparent_temperature, tempUnit)}°</p>
              </div>
              <div className="w-24 h-24 flex items-center justify-center">
                <WeatherGlyph code={current.weather_code} className="w-24 h-24" animated />
              </div>
            </div>

            {/* EC / WeatherKit text summary */}
            {dailySummary && (
              <p className="text-sm text-foreground/80 leading-relaxed bg-card/60 rounded-lg p-3">{dailySummary}</p>
            )}

            {/* AQHI (Ontario only) */}
            <AirQualityCard airQuality={weather.air_quality} />

            {/* Conditions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Droplets className="w-4 h-4" />
                  Humidity
                </div>
                <p className="text-lg font-semibold">{current.relative_humidity_2m}%</p>
              </div>
              <div className="bg-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Wind className="w-4 h-4" />
                  Wind
                </div>
                <p className="text-lg font-semibold">{formatWind(current.wind_speed_10m, tempUnit)}</p>
              </div>
              <div className="bg-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Thermometer className="w-4 h-4" />
                  {current.humidex != null ? 'Humidex' : 'Dew Point'}
                </div>
                <p className="text-lg font-semibold">
                  {current.humidex != null ? formatTemp(current.humidex, tempUnit) : formatTemp(current.dewpoint, tempUnit)}°
                </p>
              </div>
              <div className="bg-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Gauge className="w-4 h-4" />
                  Pressure
                </div>
                <p className="text-lg font-semibold">{formatPressure(current.pressure, tempUnit)}</p>
              </div>
              <div className="bg-card p-3 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Eye className="w-4 h-4" />
                  Visibility
                </div>
                <p className="text-lg font-semibold">
                  {tempUnit === 'fahrenheit' ? `${kmToMi(current.visibility).toFixed(1)} mi` : `${current.visibility.toFixed(1)} km`}
                </p>
              </div>
              {current.dewpoint != null && current.humidex != null && (
                <div className="bg-card p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Droplets className="w-4 h-4" />
                    Dew Point
                  </div>
                  <p className="text-lg font-semibold">{formatTemp(current.dewpoint, tempUnit)}°</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Conditions */}
        <HourlyConditionsCard hourly={hourly} selectedDate={selectedDate} daily={daily} tempUnit={tempUnit} />

        {/* 5-Day Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{futureDays.length}-Day Forecast</CardTitle>
            <CardDescription>Tap a day for details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {futureDays.map(({ date, idx }) => {
                const max = daily.temperature_2m_max[idx];
                const min = daily.temperature_2m_min[idx];
                const barStart = ((min - weekMin) / weekSpan) * 100;
                const barWidth = Math.max(6, ((max - min) / weekSpan) * 100);
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <button
                    key={idx}
                    onClick={() => { setSelectedDate(date); openDayDialog(date, idx); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 transition-colors text-left"
                  >
                    <p className="text-sm font-medium w-14 shrink-0">
                      {isToday ? 'Today' : new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                      <WeatherGlyph code={daily.weather_code[idx]} className="w-9 h-9" />
                    </div>
                    <p className="text-xs text-muted-foreground w-10 text-right shrink-0">{formatTemp(min, tempUnit)}°</p>
                    <div className="flex-1 h-1.5 bg-muted rounded-full relative overflow-hidden">
                      <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 via-amber-400 to-red-400"
                        style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="text-sm font-semibold w-10 text-right shrink-0">{formatTemp(max, tempUnit)}°</p>
                  </button>
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
            {current.wind_speed_10m < 8 && (
              <p>✓ Light winds — ideal for sight fishing and surface presentations</p>
            )}
            {current.wind_speed_10m >= 16 && (
              <p>✓ Strong winds — try heavier flies and lures, fish may be deeper</p>
            )}
            {current.relative_humidity_2m > 70 && (
              <p>✓ High humidity — great for insect activity and hatches</p>
            )}
            {current.temperature_2m > 10 && current.temperature_2m < 24 && (
              <p>✓ Comfortable temperature range for most freshwater species</p>
            )}
          </CardContent>
        </Card>
      </div>

      <DayForecastDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        dayData={dayDialogData}
        hourly={hourly}
        tempUnit={tempUnit}
        location={location}
      />
    </div>
  );
}
