import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Droplets, Sun, Moon } from 'lucide-react';
import WeatherGlyph from '@/components/weather/WeatherGlyph';
import { formatTemp, formatWind, formatPrecip, formatPressure } from '@/lib/weatherUnits';

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
    const maxTemp = formatTemp(daily.temperature_2m_max[idx], tempUnit);
    const minTemp = formatTemp(daily.temperature_2m_min[idx], tempUnit);
    const precipProb = daily.precipitation_probability?.[idx] ?? 0;
    let summary = `${desc} with highs near ${maxTemp}° and lows around ${minTemp}°.`;
    if (precipProb >= 60) summary += ` High chance of precipitation (${precipProb}%).`;
    else if (precipProb >= 30) summary += ` Possible precipitation (${precipProb}%).`;
    else summary += ` Low chance of rain (${precipProb}%).`;
    return summary;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-y-auto gap-0 max-h-[85vh]">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>{dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-3 min-w-0">
          {/* Summary */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <WeatherGlyph code={daily.weather_code[idx]} className="w-20 h-24 shrink-0" />
              <p className="text-6xl font-bold text-primary leading-none">{formatTemp(daily.temperature_2m_max[idx], tempUnit)}°</p>
              <div className="flex flex-col justify-center">
                <p className="text-muted-foreground text-sm leading-tight">{getWeatherDescription(daily.weather_code[idx])}</p>
                {midApparent != null && (
                  <p className="text-xs text-muted-foreground leading-tight">Feels like {formatTemp(midApparent, tempUnit)}°</p>
                )}
                <p className="text-xs text-muted-foreground leading-tight">H: {formatTemp(daily.temperature_2m_max[idx], tempUnit)}°  L: {formatTemp(daily.temperature_2m_min[idx], tempUnit)}°</p>
                {location && (
                  <p className="text-xs text-muted-foreground leading-tight truncate">{location}</p>
                )}
              </div>
            </div>

            {/* Conditions List */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 py-1">
                <WeatherGlyph code={51} className="w-7 h-8 shrink-0" />
                <span className="text-sm text-muted-foreground">Humidity</span>
                <p className="text-base font-semibold">{midHumidity != null ? midHumidity + '%' : '—'}</p>
              </div>
              <div className="flex items-center gap-2 py-1">
                <WeatherGlyph code={45} className="w-7 h-8 shrink-0" />
                <span className="text-sm text-muted-foreground">Wind</span>
                <p className="text-base font-semibold">{formatWind(daily.wind_speed_10m_max?.[idx] ?? 0, tempUnit)}</p>
              </div>
              <div className="flex items-center gap-2 py-1">
                <WeatherGlyph code={63} className="w-7 h-8 shrink-0" />
                <span className="text-sm text-muted-foreground">Precip</span>
                <p className="text-base font-semibold">{formatPrecip(daily.precipitation_sum?.[idx] ?? 0, tempUnit)}</p>
              </div>
              <div className="flex items-center gap-2 py-1">
                <WeatherGlyph code={3} className="w-7 h-8 shrink-0" />
                <span className="text-sm text-muted-foreground">Pressure</span>
                <p className="text-base font-semibold">{midPressure != null ? formatPressure(midPressure, tempUnit) : '—'}</p>
              </div>
            </div>

            {/* Daily Summary */}
            <p className="text-sm text-muted-foreground leading-relaxed pt-1 break-words w-full min-w-0">{getDailySummary()}</p>
          </div>

          {/* Sun times */}
          {sunrise && sunset && (
            <div className="flex items-center gap-4 bg-secondary/40 rounded-lg p-3 text-xs">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-yellow-500" />
                {sunrise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </span>
              <span className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                {sunset.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
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
                        <p className="text-xs font-semibold">{formatTemp(hourly.temperature_2m[hIdx], tempUnit)}°</p>
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