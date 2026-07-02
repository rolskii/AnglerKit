import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Moon, Droplets } from 'lucide-react';

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

  const todayHours = hourly.time
    .map((hTime, hIdx) => ({ hTime, hIdx }))
    .filter(({ hTime }) => hTime.startsWith(selectedDate));

  if (todayHours.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pt-3 pb-2">
        <CardTitle className="text-base">Hourly Conditions</CardTitle>
        <CardDescription>{formatDate(selectedDate)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {todayHours.map(({ hTime, hIdx }) => {
              const hourDate = new Date(hTime);
              const isNight = sunrise && sunset ? (hourDate < sunrise || hourDate > sunset) : false;
              const HourIcon = getWeatherIcon(hourly.weather_code[hIdx], isNight);
              const hourLabel = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
              return (
                <div key={hIdx} className="flex flex-col items-center gap-1.5 w-16 p-2 rounded-lg bg-secondary/40">
                  <p className="text-xs text-muted-foreground">{hourLabel}</p>
                  <HourIcon className="w-6 h-6 text-primary" />
                  <p className="text-sm font-semibold">{Math.round(hourly.temperature_2m[hIdx])}°</p>
                  <p className="text-xs text-primary flex items-center gap-0.5">
                    <Droplets className="w-3 h-3" />
                    {hourly.precipitation_probability?.[hIdx] ?? 0}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}