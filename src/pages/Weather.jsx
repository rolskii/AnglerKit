import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, MapPin, ChevronDown, Thermometer, Eye, Wind, Gauge, TrendingUp, TrendingDown, Minus, Sunrise, Sunset } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { searchLocations, geocodeLocation } from '@/lib/geocode';
import LocationMapPicker from '@/components/moon/LocationMapPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import HourlyConditionsCard from '@/components/weather/HourlyConditionsCard';
import DayForecastDialog from '@/components/weather/DayForecastDialog';
import WeatherGlyph from '@/components/weather/WeatherGlyph';
import ShareStatusButton from '@/components/ShareStatusButton';
import { formatTemp, formatWind, formatPrecip, formatPressure, formatVisibility } from '@/lib/weatherUnits';

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
  const [savedLocations, setSavedLocations] = useState(() => {
    const stored = localStorage.getItem('moonSavedLocations');
    return stored ? JSON.parse(stored) : [];
  });
  const todayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const today = todayStr();
  const contentRef = useRef(null);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: '2-digit' });
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleMapSelect = (name, lat, lon) => {
    fetchWeatherByCoords(lat, lon, name, tempUnit);
  };

  useEffect(() => {
    const syncSaved = () => {
      const stored = localStorage.getItem('moonSavedLocations');
      setSavedLocations(stored ? JSON.parse(stored) : []);
    };
    window.addEventListener('moonSavedLocationsChanged', syncSaved);
    return () => window.removeEventListener('moonSavedLocationsChanged', syncSaved);
  }, []);

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
      const res = await base44.functions.invoke('ecweather', { lat, lon, unit, localDate: todayStr(), tzOffset: new Date().getTimezoneOffset() });
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
    window.dispatchEvent(new Event('weatherTempUnitChanged'));
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

  const getHealthAdvisory = () => {
    const parts = [];

    // Humidex advisory (based on Celsius thresholds)
    if (displayHumidex != null) {
      const h = displayHumidex;
      if (h >= 46) {
        parts.push({ icon: '🔥', text: `Humidex ${h} — dangerous heat. Avoid exertion and stay hydrated.`, tone: 'text-red-600' });
      } else if (h >= 40) {
        parts.push({ icon: '⚠️', text: `Humidex ${h} — great discomfort. Avoid strenuous outdoor activity.`, tone: 'text-orange-600' });
      } else if (h >= 30) {
        parts.push({ icon: '💧', text: `Humidex ${h} — some discomfort from humidity.`, tone: 'text-amber-600' });
      } else {
        parts.push({ icon: '✅', text: `Humidex ${h} — comfortable.`, tone: 'text-green-600' });
      }
    }

    // UV index advisory
    if (current.uv_index != null) {
      const uv = current.uv_index;
      if (uv >= 8) {
        parts.push({ icon: '🧴', text: `UV index ${uv} (${current.uv_category || 'very high'}) — apply heavy sunblock, wear a hat, and limit sun exposure.`, tone: 'text-red-600' });
      } else if (uv >= 6) {
        parts.push({ icon: '🧴', text: `UV index ${uv} (${current.uv_category || 'high'}) — apply sunblock and seek shade during midday.`, tone: 'text-orange-600' });
      } else if (uv >= 3) {
        parts.push({ icon: '🧴', text: `UV index ${uv} (${current.uv_category || 'moderate'}) — sunblock recommended.`, tone: 'text-amber-600' });
      } else {
        parts.push({ icon: '✅', text: `UV index ${uv} (${current.uv_category || 'low'}) — no sun protection needed.`, tone: 'text-green-600' });
      }
    }

    return parts;
  };

  const isNight = () => {
    if (!weather?.daily?.sunrise?.[0] || !weather?.daily?.sunset?.[0]) return false;
    const now = new Date();
    const sunrise = new Date(weather.daily.sunrise[0]);
    const sunset = new Date(weather.daily.sunset[0]);
    return now < sunrise || now > sunset;
  };

  const getDailySummary = () => {
    if (!daily) return null;
    const dayIdx = daily.time.indexOf(selectedDate);
    if (dayIdx === -1) return null;
    const code = daily.weather_code[dayIdx];
    const maxTemp = formatTemp(daily.temperature_2m_max[dayIdx], tempUnit);
    const minTemp = formatTemp(daily.temperature_2m_min[dayIdx], tempUnit);
    const precipProb = daily.precipitation_probability?.[dayIdx] ?? 0;
    const desc = getWeatherDescription(code);

    let summary = `${desc} with highs near ${maxTemp}° and lows around ${minTemp}°.`;
    if (precipProb >= 60) summary += ` High chance of precipitation (${precipProb}%).`;
    else if (precipProb >= 30) summary += ` Possible precipitation (${precipProb}%).`;
    else summary += ` Low chance of rain (${precipProb}%).`;
    return summary;
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
  const selectedDayIdx = (() => {
    const idx = daily.time.indexOf(selectedDate);
    return idx === -1 ? 0 : idx;
  })();
  const ecDaySummary = daily.text_summary?.[selectedDayIdx] || null;
  const displayHumidex = (() => {
    if (ecDaySummary) {
      const m = ecDaySummary.match(/humidex\s+(\d+)/i);
      if (m) return parseInt(m[1]);
    }
    return current.humidex != null ? Math.round(current.humidex) : null;
  })();
  const ecNightSummary = daily.night_text_summary?.[selectedDayIdx] || null;
  const sunriseTime = daily.sunrise?.[selectedDayIdx];
  const sunsetTime = daily.sunset?.[selectedDayIdx];
  const forecastDays = daily.time
    .slice(1, 6)
    .map((date, idx) => ({ date, idx: idx + 1 }));
  return (
    <div className="space-y-3 md:space-y-4 -mt-4 md:-mt-8">
      <div className="max-w-2xl mx-auto space-y-3">
      <div ref={contentRef} className="space-y-3">
        {/* Header */}
        <div className="space-y-2 px-1 mb-2">
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
          <CardContent className="p-3">
            <div className="space-y-2">
              {/* Temperature hero (left) + Date/Location (right, stacked) */}
              <div className="flex items-center justify-between gap-2 py-0">
                <div className="flex items-center gap-2">
                  <p className="text-6xl font-bold text-primary leading-none">{formatTemp(current.temperature_2m, tempUnit)}°</p>
                  <WeatherGlyph code={current.weather_code} isNight={isNight()} darkOutline animated className="w-16 h-20 shrink-0" />
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
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

              {/* EC Text Summaries + Health Advisories */}
              <div className="bg-secondary/60 rounded-lg p-2.5 space-y-1">
                {ecDaySummary ? (
                  <p className="text-sm text-foreground leading-snug">{ecDaySummary}</p>
                ) : getDailySummary() ? (
                  <p className="text-sm text-foreground leading-snug">{getDailySummary()}</p>
                ) : null}
                {ecNightSummary && (
                  <p className="text-sm text-foreground leading-snug">
                    <span className="font-semibold">Night:</span> {ecNightSummary}
                  </p>
                )}
                {getHealthAdvisory().map((adv, i) => (
                  <p key={i} className={`text-xs font-medium leading-snug ${adv.tone}`}>
                    {adv.icon} {adv.text}
                  </p>
                ))}
                {(sunriseTime || sunsetTime) && (
                  <div className="flex items-center gap-4 pt-0.5">
                    {sunriseTime && (
                      <div className="flex items-center gap-1.5">
                        <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-muted-foreground">Sunrise</span>
                        <span className="text-xs font-medium">{formatTime(sunriseTime)}</span>
                      </div>
                    )}
                    {sunsetTime && (
                      <div className="flex items-center gap-1.5">
                        <Sunset className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Sunset</span>
                        <span className="text-xs font-medium">{formatTime(sunsetTime)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conditions Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <WeatherGlyph code={current.weather_code} isNight={isNight()} darkOutline animated className="w-12 h-14 text-primary -mb-3" />
                  <p className="text-xs font-semibold leading-tight text-center truncate w-full">{current.condition || getWeatherDescription(current.weather_code)}</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Condition</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <Gauge className="w-8 h-10 text-primary" />
                  <p className="text-xs font-semibold leading-tight">{formatPressure(current.pressure, tempUnit)}</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Pressure</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  {current.pressure_tendency === 'rising' ? <TrendingUp className="w-8 h-10 text-primary" /> : current.pressure_tendency === 'falling' ? <TrendingDown className="w-8 h-10 text-primary" /> : <Minus className="w-8 h-10 text-primary" />}
                  <p className="text-xs font-semibold leading-tight capitalize">{current.pressure_tendency || '—'}</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Tendency</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <Thermometer className="w-8 h-10 text-primary" />
                  <p className="text-xs font-semibold leading-tight">{formatTemp(current.temperature_2m, tempUnit)}°</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Temperature</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <Thermometer className="w-8 h-10 text-primary" />
                  <p className="text-xs font-semibold leading-tight">{formatTemp(current.dewpoint, tempUnit)}°</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Dew Point</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <Droplets className="w-8 h-10 text-primary" />
                  <p className="text-xs font-semibold leading-tight">{current.relative_humidity_2m}%</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Humidity</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <Droplets className="w-8 h-10 text-primary" />
                  <p className="text-xs font-semibold leading-tight">{displayHumidex != null ? displayHumidex : '—'}</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Humidex</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <Eye className="w-8 h-10 text-primary" />
                  <p className="text-xs font-semibold leading-tight">{formatVisibility(current.visibility, tempUnit)}</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">Visibility</span>
                </div>
                <div className="bg-secondary rounded-lg flex flex-col items-center gap-1 overflow-hidden">
                  <Wind className="w-8 h-10 text-primary" />
                  <p className="text-xs font-semibold leading-tight">{formatWind(current.wind_speed_10m, tempUnit)}</p>
                  <span className="text-[10px] text-muted-foreground leading-tight">{current.wind_direction || 'Wind'}</span>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Hourly Conditions for Selected Date */}
        <HourlyConditionsCard
          hourly={weather.hourly}
          selectedDate={selectedDate}
          daily={daily}
          tempUnit={tempUnit}
        />

        {/* 10-Day Forecast */}
        <Card>
          <CardHeader className="pt-3 pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">5-Day Forecast</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-0.5">
              {forecastDays.map(({ date, idx }) => {
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDay({ date, idx, daily });
                      setDayDialogOpen(true);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer"
                  >
                    <div className="w-14 shrink-0">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <WeatherGlyph code={daily.weather_code[idx]} className="w-10 h-12 shrink-0" />
                    {daily.precipitation_probability?.[idx] > 0 && (
                      <p className="text-[10px] text-primary flex items-center gap-0.5 shrink-0 w-10">
                        <Droplets className="w-2.5 h-2.5" />
                        {daily.precipitation_probability[idx]}%
                      </p>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-sm text-muted-foreground">{formatTemp(daily.temperature_2m_min[idx], tempUnit)}°</span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, Math.max(20, (daily.temperature_2m_max[idx] - daily.temperature_2m_min[idx]) * 3))}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{formatTemp(daily.temperature_2m_max[idx], tempUnit)}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
        {/* Share */}
        <div className="px-1">
          <ShareStatusButton
            targetRef={contentRef}
            title={`Weather — ${formatDate(selectedDate)}`}
            text={[
              `📍 ${location}`,
              `${current.condition || getWeatherDescription(current.weather_code)}`,
              `🌡️ Temperature: ${formatTemp(current.temperature_2m, tempUnit)}° (feels like ${formatTemp(current.apparent_temperature, tempUnit)}°)`,
              `📊 Pressure: ${formatPressure(current.pressure, tempUnit)} (${current.pressure_tendency || '—'})`,
              `💧 Dew Point: ${formatTemp(current.dewpoint, tempUnit)}°`,
              `💦 Humidity: ${current.relative_humidity_2m}%`,
              `🌡️ Humidex: ${displayHumidex != null ? displayHumidex : '—'}`,
              `👁️ Visibility: ${formatVisibility(current.visibility, tempUnit)}`,
              `💨 Wind: ${formatWind(current.wind_speed_10m, tempUnit)} ${current.wind_direction || ''}`,
              `H: ${formatTemp(daily.temperature_2m_max[0], tempUnit)}°  L: ${formatTemp(daily.temperature_2m_min[0], tempUnit)}°`,
            ].join('\n')}
          />
        </div>

      </div>

      <LocationMapPicker
        open={mapPickerOpen}
        onOpenChange={setMapPickerOpen}
        initialCoords={lastCoords}
        savedLocations={savedLocations}
        onSelect={handleMapSelect}
      />

      <DayForecastDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        dayData={selectedDay}
        hourly={weather?.hourly}
        tempUnit={tempUnit}
        location={location}
      />
    </div>
  );
}