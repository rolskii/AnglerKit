import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Moon, Droplets, Wind } from 'lucide-react';
import WeatherGlyph from '@/components/weather/WeatherGlyph';
import { formatTemp, formatWind } from '@/lib/weatherUnits';

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

export default function HourlyConditionsCard({ hourly, selectedDate, daily, tempUnit }) {
  const scrollRef = React.useRef(null);
  const [visibleDate, setVisibleDate] = React.useState(selectedDate);

  const now = new Date();
  // Round down to the start of the current hour so the current hour's entry isn't filtered out
  now.setMinutes(0, 0, 0);
  const getLocalDateStr = (isoStr) => {
    const d = new Date(isoStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const allHours = hourly?.time
    ? hourly.time
        .map((hTime, hIdx) => ({ hTime, hIdx, localDate: getLocalDateStr(hTime) }))
        .filter(({ hTime }) => new Date(hTime) >= now)
    : [];


  useEffect(() => {
    if (scrollRef.current && allHours.length > 0) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'instant' });
    }
  }, [selectedDate, allHours.length]);

  if (!hourly || allHours.length === 0) return null;

  const getSunriseSunset = (hTime) => {
    const hDate = hTime.slice(0, 10);
    const dayIdx = daily?.time?.indexOf(hDate);
    if (dayIdx === -1 || dayIdx == null) return { sunrise: null, sunset: null };
    return {
      sunrise: daily?.sunrise?.[dayIdx] ? new Date(daily.sunrise[dayIdx]) : null,
      sunset: daily?.sunset?.[dayIdx] ? new Date(daily.sunset[dayIdx]) : null,
    };
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const itemWidth = 64; // w-16 (64px) + gap-0
    const firstVisibleIdx = Math.round(scrollLeft / itemWidth);
    const clampedIdx = Math.max(0, Math.min(firstVisibleIdx, allHours.length - 1));
    setVisibleDate(allHours[clampedIdx].localDate);
  };

  return (
    <Card>
      <CardHeader className="pt-3 pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Hourly Conditions</CardTitle>
        <CardDescription className="text-right">{formatDate(visibleDate)}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-x-auto scrollbar-hide flex gap-0 pb-1"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {allHours.map(({ hTime, hIdx }) => {
              const hourDate = new Date(hTime);
              const { sunrise, sunset } = getSunriseSunset(hTime);
              const isNight = sunrise && sunset ? (hourDate < sunrise || hourDate > sunset) : false;
              const hourLabel = hourDate.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
              const precip = hourly.precipitation_probability?.[hIdx] ?? 0;
              const precipMm = hourly.precipitation_mm?.[hIdx] ?? 0;
              const hasRain = precipMm > 0 || precip > 0;
              const fillHeight = precipMm > 0
                ? Math.max(15, Math.min(100, (precipMm / 10) * 100))
                : precip > 0
                  ? Math.max(10, precip * 0.5)
                  : 0;
              return (
                <div
                  key={hIdx}
                  className="relative flex flex-col items-center gap-0.5 w-16 p-2 shrink-0 border-r border-border last:border-r-0 overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {hasRain && fillHeight > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400/60 to-blue-300/20"
                      style={{ height: `${fillHeight}%` }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <p className="text-xs text-muted-foreground">{hourLabel}</p>
                    <WeatherGlyph code={hourly.weather_code[hIdx]} isNight={isNight} className="w-12 h-12 -mb-2" />
                    <p className="text-base font-semibold">{formatTemp(hourly.temperature_2m[hIdx], tempUnit)}°</p>
                    {precipMm > 0 ? (
                      <p className="text-xs text-primary flex items-center gap-0.5">
                        <Droplets className="w-3 h-3" />
                        {precipMm}mm
                      </p>
                    ) : precip > 0 ? (
                      <p className="text-xs text-primary flex items-center gap-0.5">
                        <Droplets className="w-3 h-3" />
                        {precip}%
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Droplets className="w-3 h-3" />
                        0%
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Wind className="w-2.5 h-2.5" />
                      {formatWind(hourly.wind_speed_10m?.[hIdx], tempUnit)}
                    </p>
                  </div>
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