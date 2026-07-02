import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Moon, Droplets } from 'lucide-react';
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

const getWeatherIcon = (code, isNight) => {
  if (code === 0 || code === 1) return isNight ? Moon : Sun;
  if (code === 2 || code === 3) return isNight ? Moon : Cloud;
  if (code >= 51 && code <= 99) return CloudRain;
  return Cloud;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

export default function HourlyConditionsCard({ hourly, selectedDate, daily }) {
  if (!hourly) return null;

  const sunrise = daily?.sunrise?.[0] ? new Date(daily.sunrise[0]) : null;
  const sunset = daily?.sunset?.[0] ? new Date(daily.sunset[0]) : null;

  const now = new Date();
  const todayHours = hourly.time
    .map((hTime, hIdx) => ({ hTime, hIdx }))
    .filter(({ hTime }) => hTime.startsWith(selectedDate))
    .filter(({ hTime }) => selectedDate !== now.toISOString().slice(0, 10) || new Date(hTime) >= now);

  if (todayHours.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pt-3 pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Hourly Conditions</CardTitle>
        <CardDescription className="text-right">{formatDate(selectedDate)}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="relative">
          <div
            className="overflow-x-auto scrollbar-hide flex gap-3 pb-1"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {todayHours.map(({ hTime, hIdx }) => {
              const hourDate = new Date(hTime);
              const isNight = sunrise && sunset ? (hourDate < sunrise || hourDate > sunset) : false;
              const hourLabel = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
              return (
                <div
                  key={hIdx}
                  className="flex flex-col items-center gap-1.5 w-16 p-2 rounded-lg bg-secondary shrink-0"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <p className="text-[10px] text-muted-foreground">{hourLabel}</p>
                  <WeatherGlyph code={hourly.weather_code[hIdx]} isNight={isNight} className="w-9 h-10" />
                  <p className="text-sm font-semibold">{Math.round(hourly.temperature_2m[hIdx])}°</p>
                  <p className="text-xs text-primary flex items-center gap-0.5">
                    <Droplets className="w-3 h-3" />
                    {hourly.precipitation_probability?.[hIdx] ?? 0}%
                  </p>
                </div>
              );
            })}
          </div>
          {/* Right edge fade indicator */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-card to-transparent" />
        </div>
      </CardContent>
    </Card>
  );
}