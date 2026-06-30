import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Camera, Moon as MoonIcon, Cloud } from "lucide-react";
import ReelDiscIcon from "@/components/ReelDiscIcon";
import { base44 } from "@/api/base44Client";

const GEAR_ENTITIES = ["FlyLine", "Reel", "Rod", "Lure", "MiscItem"];

const items = [
  {
    to: "/gear/lines",
    title: "Gear",
    description: "Lines, reels, rods, lures, flies and other gear — all in one place.",
    icon: ReelDiscIcon,
    entities: GEAR_ENTITIES,
  },
  {
    to: "/catches",
    title: "Fish Log",
    description: "Log in your catches with measurements, photos and gear used.",
    icon: Camera,
    entities: [],
  },
  {
    to: "/moon",
    title: "Moon Phase",
    description: "Check lunar phases and solunar feeding times to plan your fishing trips.",
    icon: MoonIcon,
    entities: [],
  },
  {
    to: "/weather",
    title: "Weather",
    description: "Check current weather conditions and 7-day forecast for your fishing location.",
    icon: Cloud,
    entities: [],
  },
];

const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Home() {
  const [totals, setTotals] = useState({});

  useEffect(() => {
    (async () => {
      const result = {};
      await Promise.all(
        items.filter((i) => i.entities.length).map(async (i) => {
          try {
            const lists = await Promise.all(
              i.entities.map((entity) => base44.entities[entity].list("-updated_date", 500))
            );
            result[i.to] = lists.flat().reduce((sum, r) => sum + (r.value || 0), 0);
          } catch (e) {
            result[i.to] = 0;
          }
        })
      );
      setTotals(result);
    })();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl md:text-[34px] font-heading font-bold tracking-tight leading-tight">Angler's Log</h1>
        <p className="text-sm md:text-[17px] text-muted-foreground">Organize your entire fishing arsenal—track gear, predict best fishing times with moon phases, check weather and log every catch in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
           const total = totals[item.to];
           const showTotal = item.entities.length && total != null && total > 0;
          const isGear = item.to === '/gear/lines';
          return (
            <Link key={item.to} to={item.to} className="group">
              <Card className="relative p-4 md:p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-primary/10">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 md:h-11 w-12 md:w-11 items-center justify-center rounded-lg md:rounded-xl bg-primary/20 text-primary flex-shrink-0">
                      <Icon className={isGear ? "w-8 md:w-10 h-8 md:h-10" : "w-6 md:w-8 h-6 md:h-8"} strokeWidth={2} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-base md:text-lg font-heading font-semibold tracking-tight">{item.title}</h2>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {showTotal && (
                    <div className="mt-auto pt-2 flex items-baseline gap-1.5">
                      <span className="text-xs text-muted-foreground">Total value</span>
                      <span className="text-xs md:text-sm font-semibold text-foreground">${fmt(total)}</span>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}