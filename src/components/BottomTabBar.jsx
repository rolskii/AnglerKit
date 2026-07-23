import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home as HomeIcon, Camera, Cloud, Moon as MoonIcon, Map as MapIcon, Waves, Gauge } from "lucide-react";
import { ReelIcon as ReelDiscIcon } from "@/components/GearIcons";

const tabs = [
  { to: "/", label: "Home", icon: HomeIcon, matchExact: true },
  { to: "/gear/lines", label: "Gear", icon: ReelDiscIcon, matchPrefix: "/gear" },
  { to: "/map", label: "Map", icon: MapIcon, matchExact: true },
  { to: "/catches", label: "Fish Log", icon: Camera, matchPrefix: "/catches" },
];

const CONDITIONS_ITEMS = [
  { to: "/moon", label: "Moon", icon: MoonIcon, tint: "bg-purple-100 text-purple-600" },
  { to: "/weather", label: "Weather", icon: Cloud, tint: "bg-teal-100 text-teal-600" },
  { to: "/river", label: "River", icon: Waves, tint: "bg-cyan-100 text-cyan-600" },
];

const CONDITIONS_PATHS = CONDITIONS_ITEMS.map((item) => item.to);

function TabLink({ tab }) {
  const location = useLocation();
  const Icon = tab.icon;
  const isActive = tab.matchPrefix
    ? location.pathname.startsWith(tab.matchPrefix)
    : location.pathname === tab.to;
  const handleClick = (e) => {
    if (isActive) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  return (
    <NavLink
      to={tab.to}
      onClick={handleClick}
      className={`flex flex-col items-center gap-0.5 pt-1 pb-0.5 px-1 flex-1 transition-colors ${
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
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  const isConditionsActive = CONDITIONS_PATHS.includes(location.pathname);

  useEffect(() => {
    setConditionsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!conditionsOpen) return undefined;
    function handleOutside(event) {
      if (popupRef.current?.contains(event.target)) return;
      if (buttonRef.current?.contains(event.target)) return;
      setConditionsOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [conditionsOpen]);

  const handleSelectCondition = (to) => {
    setConditionsOpen(false);
    navigate(to);
  };

  return (
    <>
      {conditionsOpen && (
        <div
          className="md:hidden fixed inset-0 z-[590] bg-black/15"
          onClick={() => setConditionsOpen(false)}
        />
      )}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[600] flex items-center justify-around px-4 border-t border-border/60 bg-background/90 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {conditionsOpen && (
          <div
            ref={popupRef}
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

        <TabLink tab={tabs[0]} />
        <TabLink tab={tabs[1]} />

        <a
          ref={buttonRef}
          role="button"
          href={location.pathname}
          onClick={(e) => { e.preventDefault(); setConditionsOpen((open) => !open); }}
          className={`flex flex-col items-center gap-0.5 pt-1 pb-0.5 px-1 flex-1 transition-colors cursor-pointer ${
            isConditionsActive || conditionsOpen ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Gauge className="w-5 h-5" strokeWidth={isConditionsActive || conditionsOpen ? 2.5 : 2} />
          <span className="text-[10px] font-medium whitespace-nowrap">Conditions</span>
        </a>

        <TabLink tab={tabs[2]} />
        <TabLink tab={tabs[3]} />
      </nav>
    </>
  );
}