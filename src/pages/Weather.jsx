import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, MapPin } from 'lucide-react';

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState('Toronto, ON');
  const [editingLocation, setEditingLocation] = useState('Toronto, ON');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`
      );
      const data = await response.json();
      setLocation(locationName);
      setEditingLocation(locationName);
      setWeather({ current: data.current, daily: data.daily });
      setLoading(false);
    } catch (err) {
      setError('Unable to fetch weather. Please try updating location manually.');
      setLoading(false);
    }
  };

  const handleLocationChange = async () => {
    if (!editingLocation.trim()) return;
    try {
      setLoading(true);
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(editingLocation)}&language=en&count=1&format=json`
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
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=7`
      );
      const data = await response.json();
      setLocation(locationName);
      setWeather({
        current: data.current,
        daily: data.daily,
      });
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch weather for that location.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserLocation();
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
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Weather</h1>
          <p className="text-muted-foreground">Current conditions and forecast</p>
        </div>

        {/* Location Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Location</label>
              <div className="flex gap-2 flex-col sm:flex-row">
                <input
                  type="text"
                  value={editingLocation}
                  onChange={(e) => setEditingLocation(e.target.value)}
                  placeholder="Enter city, state or coordinates"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationChange()}
                  onFocus={(e) => e.target.select()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleLocationChange}
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
                  <p className="text-lg font-semibold">{Math.round(current.wind_speed_10m)} mph</p>
                </div>
                <div className="bg-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Eye className="w-4 h-4" />
                    Visibility
                  </div>
                  <p className="text-lg font-semibold">{(current.visibility / 1000).toFixed(1)} mi</p>
                </div>
                <div className="bg-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CloudRain className="w-4 h-4" />
                    Precipitation
                  </div>
                  <p className="text-lg font-semibold">{current.precipitation.toFixed(2)}"</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7-Day Forecast */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">7-Day Forecast</CardTitle>
            <CardDescription>Daily high and low temperatures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {daily.time.slice(0, 7).map((date, idx) => {
                const ForecastIcon = getWeatherIcon(daily.weather_code[idx]);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <ForecastIcon className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground">{getWeatherDescription(daily.weather_code[idx])}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{Math.round(daily.temperature_2m_max[idx])}°</p>
                      <p className="text-xs text-muted-foreground">{Math.round(daily.temperature_2m_min[idx])}°</p>
                    </div>
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
            {current.temperature_2m > 70 && current.temperature_2m < 85 && (
              <p>✓ Optimal temperature range for most freshwater species</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}