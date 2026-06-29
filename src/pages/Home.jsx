import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ChevronRight, Fish, Disc, Anchor, Bug, Package } from "lucide-react";
import HorizontalLinesIcon from "@/components/HorizontalLinesIcon";
import { base44 } from "@/api/base44Client";

const items = [
  {
    to: "/rods",
    title: "Rods",
    description: "Catalog your rods and view their paired lines.",
    icon: Fish,
    entity: "Rod",
  },
  {
    to: "/reels",
    title: "Reels",
    description: "Track your reels and see which lines are spooled on each.",
    icon: Disc,
    entity: "Reel",
  },
  {
    to: "/lines",
    title: "Lines",
    description: "Manage your fly lines — brands, weights, conditions, and pairings.",
    icon: HorizontalLinesIcon,
    entity: "FlyLine",
  },
  {
    to: "/lures",
    title: "Lures & Flies",
    description: "Catalog your lures and flies with photos, sizes, and quantities.",
    icon: Bug,
    entity: "Lure",
  },
  {
    to: "/catches",
    title: "Fish Log",
    description: "Log your catches with photos, location, conditions, and gear used.",
    icon: Anchor,
    entity: null,
  },
  {
    to: "/misc",
    title: "Misc. Gear",
    description: "Track other fishing gear — apparel, tools, storage, safety, and accessories.",
    icon: Package,
    entity: "MiscItem",
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
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-[34px] font-heading font-bold tracking-tight leading-tight">Angler's Log</h1>
        <p className="text-[17px] text-muted-foreground">All your fishing gear, organized in one place.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const total = totals[item.to];
          const showTotal =
            item.entity && !["/rods", "/reels"].includes(item.to) && total != null && total > 0;
          return (
            <Link key={item.to} to={item.to} className="group">
              <Card className="relative p-5 h-full rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="w-8 h-8" strokeWidth={2} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-[19px] font-heading font-semibold tracking-tight">{item.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                  {showTotal && (
                    <div className="mt-auto pt-1 flex items-baseline gap-1.5">
                      <span className="text-xs text-muted-foreground">Total value</span>
                      <span className="text-sm font-semibold text-foreground">${fmt(total)}</span>
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