import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, Camera, Cloud, Moon as MoonIcon, Map as MapIcon, Waves, Gauge, Package } from "lucide-react";
import { ReelIcon as ReelDiscIcon, LinesIcon, RodIcon, LureIcon } from "@/components/GearIcons";

const tabs = [
  { to: "/", label: "Home", icon: HomeIcon, matchExact: true },
  { to: "/map", label: "Map", icon: MapIcon, matchExact: true },
  { to: "/catches", label: "Fish Log", icon: Camera, matchPrefix: "/catches" },
];

const CONDITIONS_ITEMS = [
  { to: "/moon", label: "Moon", icon: MoonIcon, tint: "bg-purple-100 text-purple-600" },
  { to: "/weather", label: "Weather", icon: Cloud, tint: "bg-teal-100 text-teal-600" },
  { to: "/river", label: "River", icon: Waves, tint: "bg-cyan-100 text-cyan-600" },
];
const CONDITIONS_PATHS = CONDITIONS_ITEMS.map((item) => item.to);

const GEAR_ITEMS = [
  { to: "/lines", label: "Lines", icon: LinesIcon, tint: "bg-blue-100 text-blue-600" },
  { to: "/reels", label: "Reels", icon: ReelDiscIcon, tint: "bg-orange-100 text-orange-600" },
  { to: "/rods", label: "Rods", icon: RodIcon, tint: "bg-teal-100 text-teal-600" },
  { to: "/lures", label: "Tackle", icon: LureIcon, tint: "bg-purple-100 text-purple-600" },
  { to: "/misc", label: "Misc. Gear", icon: Package, tint: "bg-orange-100 text-orange-600" },
];
const GEAR_PATHS = GEAR_ITEMS.map((item) => item.to);

function TabLink({ tab }) {
  const location = useLocation();
  const Icon = tab.icon;
  const isActive = tab.matchPrefix
    ? location.pathname.startsWith(tab.matchPrefix)
    : location.pathname === tab.to;
  return (
    <NavLink
      to={tab.to}
      className={`flex flex-col items-center gap-0.5 py-2 px-1 flex-1 transition-colors ${
        isActive ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-medium whitespace-nowrap">{tab.label}</span>
    </NavLink>
  );
}

export default function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);
  const conditionsPopupRef = useRef(null);
  const conditionsButtonRef = useRef(null);
  const gearPopupRef = useRef(null);
  const gearButtonRef = useRef(null);

  const isConditionsActive = CONDITIONS_PATHS.includes(location.pathname);
  const isGearActive = GEAR_PATHS.includes(location.pathname);

  useEffect(() => {
    setConditionsOpen(false);
    setGearOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!conditionsOpen && !gearOpen) return undefined;
    function handleOutside(event) {
      if (conditionsOpen) {
        if (conditionsPopupRef.current?.contains(event.target)) return;
        if (conditionsButtonRef.current?.contains(event.target)) return;
      }
      if (gearOpen) {
        if (gearPopupRef.current?.contains(event.target)) return;
        if (gearButtonRef.current?.contains(event.target)) return;
      }
      setConditionsOpen(false);
      setGearOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [conditionsOpen, gearOpen]);

  const handleSelectCondition = (to) => {
    setConditionsOpen(false);
    navigate(to);
  };

  const handleSelectGear = (to) => {
    setGearOpen(false);
    navigate(to);
  };

  const toggleConditions = () => {
    setGearOpen(false);
    setConditionsOpen((open) => !open);
  };

  const toggleGear = () => {
    setConditionsOpen(false);
    setGearOpen((open) => !open);
  };

  return (
    <>
      {(conditionsOpen || gearOpen) && (
        <div
          className="md:hidden fixed inset-0 z-[590] bg-black/15"
          onClick={() => {
            setConditionsOpen(false);
            setGearOpen(false);
          }}
        />
      )}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[600] flex items-center justify-around px-4 border-t border-border/60 bg-background/90 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <TabLink tab={tabs[0]} />

        <div className="relative flex-1">
          {gearOpen && (
            <div
              ref={gearPopupRef}
              className="absolute bottom-full mb-2 left-0 w-[190px] bg-card rounded-2xl shadow-xl border border-border/60 p-1.5 z-[601]"
            >
              {GEAR_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => handleSelectGear(item.to)}
                    className="w-full flex items-center gap-2.5 p-1.5 rounded-xl active:bg-accent transition-colors text-left"
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${item.tint}`}>
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </span>
                    <span className="text-[12.5px] font-semibold text-foreground">{item.label}</span>
                  </button>
                );
              })}
              <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-card border-r border-b border-border/60 rotate-45" />
            </div>
          )}
          <a
            ref={gearButtonRef}
            role="button"
            href={location.pathname}
            onClick={(e) => { e.preventDefault(); toggleGear(); }}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 w-full transition-colors cursor-pointer ${
              isGearActive || gearOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <ReelDiscIcon className="w-5 h-5" strokeWidth={isGearActive || gearOpen ? 2.5 : 2} />
            <span className="text-[10px] font-medium whitespace-nowrap">Gear</span>
          </a>
        </div>

        <div className="relative flex-1">
          {conditionsOpen && (
            <div
              ref={conditionsPopupRef}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card rounded-2xl shadow-xl border border-border/60 p-2 flex gap-1.5 z-[601]"
            >
              {CONDITIONS_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => handleSelectCondition(item.to)}
                    className="flex flex-col items-center gap-1.5 w-[68px] py-2 px-1 rounded-xl active:bg-accent transition-colors"
                  >
                    <span className={`flex items-center justify-center w-9 h-9 rounded-xl ${item.tint}`}>
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </span>
                    <span className="text-[11px] font-semibold text-foreground">{item.label}</span>
                  </button>
                );
              })}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-border/60 rotate-45" />
            </div>
          )}
          <a
            ref={conditionsButtonRef}
            role="button"
            href={location.pathname}
            onClick={(e) => { e.preventDefault(); toggleConditions(); }}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 w-full transition-colors cursor-pointer ${
              isConditionsActive || conditionsOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Gauge className="w-5 h-5" strokeWidth={isConditionsActive || conditionsOpen ? 2.5 : 2} />
            <span className="text-[10px] font-medium whitespace-nowrap">Conditions</span>
          </a>
        </div>

        <TabLink tab={tabs[1]} />
        <TabLink tab={tabs[2]} />
      </nav>
    </>
  );
}
