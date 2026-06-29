import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import {
  LogOut, Menu, X,
  Home as HomeIcon, Disc, Anchor, Bug, Package,
  ArrowLeftRight, Settings as SettingsIcon, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import TroutIcon from "@/components/TroutIcon";
import HorizontalLinesIcon from "@/components/HorizontalLinesIcon";
import FishingPoleIcon from "@/components/FishingPoleIcon";

const navItems = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/lines", label: "Lines", icon: HorizontalLinesIcon },
  { to: "/reels", label: "Reels", icon: Disc },
  { to: "/rods", label: "Rods", icon: FishingPoleIcon },
  { to: "/catches", label: "Fish Log", icon: Anchor },
  { to: "/lures", label: "Lures & Flies", icon: Bug },
  { to: "/misc", label: "Misc. Gear", icon: Package },
  { to: "/import-export", label: "Import / Export", icon: ArrowLeftRight },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/about", label: "About", icon: Info },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const appName = "Angler's Log";
  const navigate = useNavigate();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const NavLinks = () => (
    <nav>
      <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/70 hover:bg-accent hover:text-foreground"
                  }`
                }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl p-4">
        <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <TroutIcon className="w-7 h-7 text-primary-foreground" />
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
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <TroutIcon className="w-6 h-6 text-primary-foreground" />
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
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}