import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Waves, Disc, Fish, Anchor, Bug, Package } from "lucide-react";

const items = [
  {
    to: "/rods",
    title: "Rods",
    description: "Catalog your rods and view their paired lines.",
    icon: Fish,
  },
  {
    to: "/reels",
    title: "Reels",
    description: "Track your reels and see which lines are spooled on each.",
    icon: Disc,
  },
  {
    to: "/lines",
    title: "Lines",
    description: "Manage your fly lines — brands, weights, conditions, and pairings.",
    icon: Waves,
  },
  {
    to: "/lures",
    title: "Lures & Flies",
    description: "Catalog your lures and flies with photos, sizes, and quantities.",
    icon: Bug,
  },
  {
    to: "/catches",
    title: "Catch Log",
    description: "Log your catches with photos, location, conditions, and gear used.",
    icon: Anchor,
  },
  {
    to: "/misc",
    title: "Misc. Gear",
    description: "Track other fishing gear — apparel, tools, storage, safety, and accessories.",
    icon: Package,
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold">Angler's Log</h1>
        <p className="text-muted-foreground">Your fly fishing gear, organized in one place.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to}>
              <Card className="p-6 h-full hover:shadow-md hover:border-primary transition-all cursor-pointer">
                <div className="flex flex-col gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-heading font-semibold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}