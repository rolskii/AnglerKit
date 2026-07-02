import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Droplets, Wind, CloudRain, Sun, Moon } from 'lucide-react';

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

const getWeatherIcon = (code, isNight) => {
  if (code === 0 || code === 1) return isNight ? Moon : Sun;
  if (code >= 51 && code <= 99) return CloudRain;
  return null;
};

export default function DayForecastDialog({ open, onOpenChange, dayData, hourly, tempUnit }) {
  if (!dayData) return null;

  const { date, idx, daily } = dayData;
  const dateObj = new Date(date + 'T00:00:00');
  const sunrise = daily?.sunrise?.[idx] ? new Date(daily.sunrise[idx]) : null;
  const sunset = daily?.sunset?.[idx] ? new Date(daily.sunset[idx]) : null;
  const DescIcon = getWeatherIcon(daily.weather_code[idx], false);

  const dayHours = hourly
    ? hourly.time
        .map((hTime, hIdx) => ({ hTime, hIdx }))
        .filter(({ hTime }) => hTime.startsWith(date))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            {DescIcon && <DescIcon className="w-5 h-5 text-primary" />}
            {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-3">
          {/* Day summary */}
          <div className="flex items-center justify-between bg-secondary/40 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{getWeatherDescription(daily.weather_code[idx])}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold">{Math.round(daily.temperature_2m_max[idx])}°</span>
              <span className="text-muted-foreground">{Math.round(daily.temperature_2m_min[idx])}°</span>
            </div>
          </div>

          {/* Day metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
              <Droplets className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Precip</p>
              <p className="text-sm font-semibold">{daily.precipitation_probability?.[idx] ?? 0}%</p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
              <Wind className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Wind</p>
              <p className="text-sm font-semibold">
                {tempUnit === 'fahrenheit'
                  ? Math.round(daily.wind_speed_10m_max?.[idx] ?? 0) + ' mph'
                  : Math.round((daily.wind_speed_10m_max?.[idx] ?? 0) * 1.60934) + ' km/h'}
              </p>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
              <CloudRain className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Rain</p>
              <p className="text-sm font-semibold">
                {tempUnit === 'fahrenheit'
                  ? (daily.precipitation_sum?.[idx] ?? 0).toFixed(2) + '"'
                  : ((daily.precipitation_sum?.[idx] ?? 0) * 25.4).toFixed(1) + ' mm'}
              </p>
            </div>
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
                    const HourIcon = getWeatherIcon(hourly.weather_code[hIdx], isNight);
                    const hourLabel = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
                    return (
                      <div key={hIdx} className="flex flex-col items-center gap-1 w-14 p-1.5 rounded-lg bg-secondary/40 shrink-0">
                        <p className="text-[10px] text-muted-foreground">{hourLabel}</p>
                        {HourIcon && <HourIcon className="w-5 h-5 text-primary" />}
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