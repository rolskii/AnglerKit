import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Camera, Moon as MoonIcon, Cloud } from "lucide-react";
import ReelDiscIcon from "@/components/ReelDiscIcon";

const items = [
  {
    to: "/gear/lines",
    title: "Gear",
    description: "Lines, reels, rods, lures, flies and other gear — all in one place.",
    icon: ReelDiscIcon,
    tint: "orange",
  },
  {
    to: "/catches",
    title: "Fish Log",
    description: "Log in your catches with measurements, photos and gear used.",
    icon: Camera,
    tint: "blue",
  },
  {
    to: "/moon",
    title: "Moon Phase",
    description: "Check lunar phases and solunar feeding times to plan your fishing trips.",
    icon: MoonIcon,
    tint: "purple",
  },
  {
    to: "/weather",
    title: "Weather",
    description: "Check current weather conditions and 7-day forecast for your fishing location.",
    icon: Cloud,
    tint: "teal",
  },
];

const tintClasses = {
  orange: "bg-tint-orange-bg text-tint-orange",
  blue: "bg-tint-blue-bg text-tint-blue",
  purple: "bg-tint-purple-bg text-tint-purple",
  teal: "bg-tint-teal-bg text-tint-teal",
};

export default function Home() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl md:text-[34px] font-heading font-extrabold tracking-tight leading-tight">Angler's Log</h1>
        <p className="text-sm md:text-[17px] text-muted-foreground">Organize your entire fishing arsenal—track gear, predict best fishing times with moon phases, check weather and log every catch in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isGear = item.to === '/gear/lines';
          return (
            <Link key={item.to} to={item.to} className="group">
              <Card className="relative p-4 md:p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-card">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 md:h-11 w-12 md:w-11 items-center justify-center rounded-xl md:rounded-xl flex-shrink-0 ${tintClasses[item.tint]}`}>
                      <Icon className={isGear ? "w-8 md:w-10 h-8 md:h-10" : "w-6 md:w-8 h-6 md:h-8"} strokeWidth={2} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-base md:text-lg font-heading font-semibold tracking-tight">{item.title}</h2>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}