import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home as HomeIcon, Camera, Cloud, Moon as MoonIcon, Map as MapIcon, Waves } from "lucide-react";
import { ReelIcon as ReelDiscIcon } from "@/components/GearIcons";

const tabs = [
  { to: "/", label: "Home", icon: HomeIcon, matchExact: true },
  { to: "/gear/lines", label: "Gear", icon: ReelDiscIcon, matchPrefix: "/gear" },
  { to: "/catches", label: "Fish Log", icon: Camera, matchPrefix: "/catches" },
  { to: "/moon", label: "Moon", icon: MoonIcon, matchExact: true },
  { to: "/weather", label: "Weather", icon: Cloud, matchExact: true },
  { to: "/river", label: "River", icon: Waves, matchExact: true },
  { to: "/map", label: "Map", icon: MapIcon, matchExact: true },
];

export default function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[600] flex items-center justify-around border-t border-border/60 bg-background/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isGear = tab.to === "/gear/lines";
        const isActive = tab.matchPrefix
          ? location.pathname.startsWith(tab.matchPrefix)
          : location.pathname === tab.to;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className={isGear ? "w-6 h-6" : "w-5 h-5"} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}