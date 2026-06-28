import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Waves, Disc, Fish, Anchor, Bug, Package } from "lucide-react";
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
    icon: Waves,
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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold">Angler's Log</h1>
        <p className="text-muted-foreground">All your fishing gear, organized in one place.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const total = totals[item.to];
          return (
            <Link key={item.to} to={item.to}>
              <Card className="p-6 h-full hover:shadow-md hover:border-primary transition-all cursor-pointer">
                <div className="flex flex-col gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.entity && !["/rods", "/reels"].includes(item.to) && total != null && total > 0 && (
                    <p className="text-sm font-medium text-foreground mt-auto">
                      Total value ${fmt(total)}
                    </p>
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