import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinesIcon, ReelIcon, RodIcon, LureIcon } from "@/components/GearIcons";
import { Package } from "lucide-react";
import Lines from "@/pages/Lines";
import Reels from "@/pages/Reels";
import Rods from "@/pages/Rods";
import Lures from "@/pages/Lures";
import Misc from "@/pages/Misc";
import PullToRefresh from "@/components/PullToRefresh";

const tintClasses = {
  orange: "bg-tint-orange-bg text-tint-orange",
  blue: "bg-tint-blue-bg text-tint-blue",
  purple: "bg-tint-purple-bg text-tint-purple",
  teal: "bg-tint-teal-bg text-tint-teal",
};

const TABS = [
  { value: "lines", label: "Lines", icon: LinesIcon, Component: Lines, tint: "blue" },
  { value: "reels", label: "Reels", icon: ReelIcon, Component: Reels, tint: "orange" },
  { value: "rods", label: "Rods", icon: RodIcon, Component: Rods, tint: "teal" },
  { value: "lures", label: "Tackle", icon: LureIcon, Component: Lures, tint: "purple" },
  { value: "misc", label: "Misc. Gear", icon: Package, Component: Misc, tint: "orange" },
];

export default function Gear() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const active = TABS.some((t) => t.value === tab) ? tab : "lines";
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl md:text-[34px] font-heading font-bold tracking-tight leading-tight">Gear</h1>
        <p className="text-sm md:text-[17px] text-muted-foreground">
          Everything in your fishing arsenal, in one place.
        </p>
      </div>

      <Tabs value={active} onValueChange={(v) => navigate(`/gear/${v}`, { replace: true })}>
        <TabsList className="grid grid-cols-5 gap-2 h-auto bg-transparent p-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border/60 px-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary shadow-sm">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tintClasses[t.tint]}`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-[11px] font-medium leading-tight text-center">{t.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={`${t.value}-${refreshKey}`} value={t.value} className="mt-5 focus-visible:outline-none">
            <t.Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
    </PullToRefresh>
  );
}