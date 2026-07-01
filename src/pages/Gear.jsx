import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinesIcon, ReelIcon, RodIcon, LureIcon } from "@/components/GearIcons";
import { Package } from "lucide-react";
import Lines from "@/pages/Lines";
import Reels from "@/pages/Reels";
import Rods from "@/pages/Rods";
import Lures from "@/pages/Lures";
import Misc from "@/pages/Misc";

const TABS = [
  { value: "lines", label: "Lines", icon: LinesIcon, Component: Lines },
  { value: "reels", label: "Reels", icon: ReelIcon, Component: Reels },
  { value: "rods", label: "Rods", icon: RodIcon, Component: Rods },
  { value: "lures", label: "Lures & Flies", icon: LureIcon, Component: Lures },
  { value: "misc", label: "Misc. Gear", icon: Package, Component: Misc },
];

export default function Gear() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const active = TABS.some((t) => t.value === tab) ? tab : "lines";

  return (
    <div className="space-y-6">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl md:text-[34px] font-heading font-bold tracking-tight leading-tight">Gear</h1>
        <p className="text-sm md:text-[17px] text-muted-foreground">
          Everything in your fishing arsenal, in one place.
        </p>
      </div>

      <Tabs value={active} onValueChange={(v) => navigate(`/gear/${v}`, { replace: true })}>
        <div className="grid grid-cols-5 gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border/60 px-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary shadow-sm">
                <Icon className="w-6 h-6" strokeWidth={1.75} />
                <span className="text-[11px] font-medium leading-tight text-center">{t.label}</span>
              </TabsTrigger>
            );
          })}
        </div>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-5 focus-visible:outline-none">
            <t.Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}