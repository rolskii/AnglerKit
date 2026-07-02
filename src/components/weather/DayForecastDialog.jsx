import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Droplets, Sun, Moon } from 'lucide-react';
import WeatherGlyph from '@/components/weather/WeatherGlyph';

const getWeatherDescription = (code) => {
  const codes = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
    45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle',
    55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
    80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Light Snow Showers', 86: 'Snow Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
  };
  return codes[code] || 'Unknown';
};

export default function DayForecastDialog({ open, onOpenChange, dayData, hourly, tempUnit, location }) {
  if (!dayData) return null;

  const { date, idx, daily } = dayData;
  const dateObj = new Date(date + 'T00:00:00');
  const sunrise = daily?.sunrise?.[idx] ? new Date(daily.sunrise[idx]) : null;
  const sunset = daily?.sunset?.[idx] ? new Date(daily.sunset[idx]) : null;

  const dayHours = hourly
    ? hourly.time
        .map((hTime, hIdx) => ({ hTime, hIdx }))
        .filter(({ hTime }) => hTime.startsWith(date))
    : [];

  // Find midday hour for representative conditions (humidity, pressure, apparent temp)
  const middayHour = dayHours.length > 0
    ? dayHours.reduce((closest, h) => {
        const hour = new Date(h.hTime).getHours();
        return Math.abs(hour - 13) < Math.abs(new Date(closest.hTime).getHours() - 13) ? h : closest;
      })
    : null;
  const midIdx = middayHour?.hIdx;
  const midHumidity = midIdx != null ? hourly?.relative_humidity_2m?.[midIdx] : null;
  const midPressure = midIdx != null ? hourly?.pressure_msl?.[midIdx] ?? hourly?.surface_pressure?.[midIdx] : null;
  const midApparent = midIdx != null ? hourly?.apparent_temperature?.[midIdx] : null;

  const getDailySummary = () => {
    const desc = getWeatherDescription(daily.weather_code[idx]);
    const maxTemp = Math.round(daily.temperature_2m_max[idx]);
    const minTemp = Math.round(daily.temperature_2m_min[idx]);
    const precipProb = daily.precipitation_probability?.[idx] ?? 0;
    let summary = `${desc} with highs near ${maxTemp}° and lows around ${minTemp}°.`;
    if (precipProb >= 60) summary += ` High chance of precipitation (${precipProb}%).`;
    else if (precipProb >= 30) summary += ` Possible precipitation (${precipProb}%).`;
    else summary += ` Low chance of rain (${precipProb}%).`;
    return summary;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-3">
          {/* Top card style summary */}
          <div className="bg-primary/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-stretch gap-3">
                <p className="text-6xl font-bold text-primary leading-none self-center">{Math.round(daily.temperature_2m_max[idx])}°</p>
                <div className="flex flex-col justify-center">
                  <p className="text-muted-foreground text-sm leading-tight">{getWeatherDescription(daily.weather_code[idx])}</p>
                  {midApparent != null && (
                    <p className="text-xs text-muted-foreground leading-tight">Feels like {Math.round(midApparent)}°</p>
                  )}
                  <p className="text-xs text-muted-foreground leading-tight">H: {Math.round(daily.temperature_2m_max[idx])}°  L: {Math.round(daily.temperature_2m_min[idx])}°</p>
                </div>
              </div>
              <WeatherGlyph code={daily.weather_code[idx]} className="w-20 h-24 shrink-0" />
              {location && (
                <div className="flex flex-col items-end gap-1 shrink-0 justify-center">
                  <p className="text-xs text-muted-foreground max-w-[100px] truncate text-right">{location}</p>
                </div>
              )}
            </div>

            {/* Conditions Grid */}
            <div className="grid grid-cols-4 gap-1">
              <div className="bg-secondary p-1.5 rounded-lg flex flex-col items-center gap-0.5 overflow-hidden">
                <WeatherGlyph code={51} className="w-6 h-7" />
                <p className="text-[10px] font-semibold leading-tight">{midHumidity != null ? midHumidity + '%' : '—'}</p>
                <span className="text-[9px] text-muted-foreground leading-tight">Humidity</span>
              </div>
              <div className="bg-secondary p-1.5 rounded-lg flex flex-col items-center gap-0.5 overflow-hidden">
                <WeatherGlyph code={45} className="w-6 h-7" />
                <p className="text-[10px] font-semibold leading-tight">
                  {tempUnit === 'fahrenheit'
                    ? Math.round(daily.wind_speed_10m_max?.[idx] ?? 0) + 'mph'
                    : Math.round((daily.wind_speed_10m_max?.[idx] ?? 0) * 1.60934) + 'km/h'}
                </p>
                <span className="text-[9px] text-muted-foreground leading-tight">Wind</span>
              </div>
              <div className="bg-secondary p-1.5 rounded-lg flex flex-col items-center gap-0.5 overflow-hidden">
                <WeatherGlyph code={63} className="w-6 h-7" />
                <p className="text-[10px] font-semibold leading-tight">
                  {tempUnit === 'fahrenheit'
                    ? (daily.precipitation_sum?.[idx] ?? 0).toFixed(2) + '"'
                    : ((daily.precipitation_sum?.[idx] ?? 0) * 25.4).toFixed(1) + 'mm'}
                </p>
                <span className="text-[9px] text-muted-foreground leading-tight">Precip</span>
              </div>
              <div className="bg-secondary p-1.5 rounded-lg flex flex-col items-center gap-0.5 overflow-hidden">
                <WeatherGlyph code={3} className="w-6 h-7" />
                <p className="text-[10px] font-semibold leading-tight">{midPressure != null ? (midPressure / 10).toFixed(1) + 'kPa' : '—'}</p>
                <span className="text-[9px] text-muted-foreground leading-tight">Pressure</span>
              </div>
            </div>

            {/* Daily Summary */}
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">{getDailySummary()}</p>
          </div>

          {/* Sun times */}
          {sunrise && sunset && (
            <div className="flex items-center justify-between bg-secondary/40 rounded-lg p-3 text-xs">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-yellow-500" />
                {sunrise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
              <span className="flex items-center gap-1.5">
                {sunset.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              </span>
            </div>
          )}

          {/* Hourly breakdown */}
          {dayHours.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Hourly Breakdown</p>
              <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
                <div className="flex gap-2 min-w-max pb-1">
                  {dayHours.map(({ hTime, hIdx }) => {
                    const hourDate = new Date(hTime);
                    const isNight = sunrise && sunset ? (hourDate < sunrise || hourDate > sunset) : false;
                    const hourLabel = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                    return (
                      <div key={hIdx} className="flex flex-col items-center gap-1 w-14 p-1.5 rounded-lg bg-secondary/40 shrink-0">
                        <p className="text-[10px] text-muted-foreground">{hourLabel}</p>
                        <WeatherGlyph code={hourly.weather_code[hIdx]} isNight={isNight} className="w-5 h-6" />
                        <p className="text-xs font-semibold">{Math.round(hourly.temperature_2m[hIdx])}°</p>
                        <p className="text-[10px] text-primary flex items-center gap-0.5">
                          <Droplets className="w-2.5 h-2.5" />
                          {hourly.precipitation_probability?.[hIdx] ?? 0}%
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}