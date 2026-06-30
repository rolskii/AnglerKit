import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Camera, Package } from "lucide-react";
import HorizontalLinesIcon from "@/components/HorizontalLinesIcon";
import VerticalLinesIcon from "@/components/VerticalLinesIcon";
import FishingHookIcon from "@/components/FishingHookIcon";
import ReelDiscIcon from "@/components/ReelDiscIcon";
import { base44 } from "@/api/base44Client";

const items = [
  {
    to: "/lines",
    title: "Lines",
    description: "Manage your different kinds of lines and fly lines - brands, weights, conditions and rod & reel pairings.",
    icon: HorizontalLinesIcon,
    entity: "FlyLine",
  },
  {
    to: "/reels",
    title: "Reels",
    description: "Track your reels and see which ones are in use along with the lines spooled on each.",
    icon: ReelDiscIcon,
    entity: "Reel",
  },
  {
    to: "/rods",
    title: "Rods",
    description: "Catalog your rods and view their paired lines.",
    icon: VerticalLinesIcon,
    entity: "Rod",
  },
  {
    to: "/lures",
    title: "Lures & Flies",
    description: "Catalog your lures, tackle and flies with photos, sizes and quantities.",
    icon: FishingHookIcon,
    entity: "Lure",
  },
  {
    to: "/misc",
    title: "Misc. Gear",
    description: "Track other fishing gear - apparel, tools and accessories.",
    icon: Package,
    entity: "MiscItem",
  },
  {
    to: "/catches",
    title: "Fish Log",
    description: "Log in your catches with measurements, photos and gear used.",
    icon: Camera,
    entity: null,
  },
];

const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Home() {
  const [totals, setTotals] = useState({});

  useEffect(() => {
    (async () => {
      const result = {};
      await Promise.all(
        items.filter((i) => i.entity).map(async (i) => {
          try {
            const records = await base44.entities[i.entity].list("-updated_date", 500);
            result[i.to] = records.reduce((sum, r) => sum + (r.value || 0), 0);
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
        <p className="text-sm md:text-[17px] text-muted-foreground">All your fishing gear, organized in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {items.map((item) => {
          const Icon = item.icon;
           const total = totals[item.to];
           const showTotal =
             item.entity && !["/rods", "/reels", "/lines", "/lures", "/misc"].includes(item.to) && total != null && total > 0;
          return (
            <Link key={item.to} to={item.to} className="group">
              <Card className="relative p-4 md:p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-primary/10">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 md:h-11 w-12 md:w-11 items-center justify-center rounded-lg md:rounded-xl bg-primary/20 text-primary flex-shrink-0">
                      <Icon className="w-6 md:w-8 h-6 md:h-8" strokeWidth={2} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-base md:text-lg font-heading font-semibold tracking-tight">{item.title}</h2>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.description}</p>
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