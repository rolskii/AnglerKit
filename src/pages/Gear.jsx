import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HorizontalLinesIcon from "@/components/HorizontalLinesIcon";
import VerticalLinesIcon from "@/components/VerticalLinesIcon";
import ReelDiscIcon from "@/components/ReelDiscIcon";
import FishingHookIcon from "@/components/FishingHookIcon";
import { Package } from "lucide-react";
import Lines from "@/pages/Lines";
import Reels from "@/pages/Reels";
import Rods from "@/pages/Rods";
import Lures from "@/pages/Lures";
import Misc from "@/pages/Misc";

const TABS = [
  { value: "lines", label: "Lines", icon: HorizontalLinesIcon, Component: Lines },
  { value: "reels", label: "Reels", icon: ReelDiscIcon, Component: Reels },
  { value: "rods", label: "Rods", icon: VerticalLinesIcon, Component: Rods },
  { value: "lures", label: "Lures & Flies", icon: FishingHookIcon, Component: Lures },
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
        <TabsList className="h-auto flex-wrap gap-1 bg-muted/60 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 px-3 py-1.5">
                <Icon className="w-4 h-4" strokeWidth={2} />
                {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-5 focus-visible:outline-none">
            <t.Component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
