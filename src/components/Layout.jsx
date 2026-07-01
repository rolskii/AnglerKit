import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LogOut, Menu, X,
  Home as HomeIcon, Camera, Cloud,
  Settings as SettingsIcon, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import TroutIcon from "@/components/TroutIcon";
import ReelDiscIcon from "@/components/ReelDiscIcon";
import { Moon as MoonIcon } from "lucide-react";
import BottomTabBar from "@/components/BottomTabBar";

const navItems = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/gear/lines", label: "Gear", icon: ReelDiscIcon, matchPrefix: "/gear" },
  { to: "/catches", label: "Fish Log", icon: Camera, matchPrefix: "/catches" },
  { to: "/moon", label: "Moon Phase", icon: MoonIcon },
  { to: "/weather", label: "Weather", icon: Cloud },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/about", label: "About", icon: Info },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const appName = "Angler's Log";
  const navigate = useNavigate();

  // Initialize theme — defaults to system light/dark preference
  useEffect(() => {
    const stored = localStorage.getItem("theme") || "system";
    const isDark = stored === "dark" || (stored === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const t = localStorage.getItem("theme") || "system";
      if (t === "system") {
        document.documentElement.classList.toggle("dark", mq.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const NavLinks = () => {
    const location = useLocation();
    return (
      <nav>
        <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchPrefix
              ? location.pathname.startsWith(item.matchPrefix)
              : location.pathname === item.to;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl p-4">
        <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-5">
           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3a52] text-white shadow-sm">
             <TroutIcon className="w-7 h-7 text-white" />
           </div>
          <div>
            <p className="font-heading font-semibold leading-tight tracking-tight">{appName}</p>
            <p className="text-xs text-muted-foreground">Inventory Manager</p>
          </div>
        </Link>
        <NavLinks />
        <div className="mt-auto pt-4 border-t border-border/60">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-foreground/60 hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a3a52] text-white shadow-sm">
             <TroutIcon className="w-6 h-6 text-white" />
           </div>
          <span className="font-heading font-semibold tracking-tight">{appName}</span>
        </Link>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-200" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-72 bg-sidebar/95 backdrop-blur-xl p-4 pt-6 rounded-l-2xl shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="h-1.5 w-10 rounded-full bg-foreground/20" />
            </div>
            <NavLinks />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl text-foreground/60 hover:text-foreground mt-4"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Log out
            </Button>
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-20 md:px-8 md:py-10 md:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}