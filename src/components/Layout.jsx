import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const navItems = [
  { to: "/lines", label: "Fly Lines" },
  { to: "/reels", label: "Reels" },
  { to: "/rods", label: "Fly Rods" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const NavLinks = () => (
    <nav>
      <ul className="flex flex-col gap-1 list-none m-0 p-0">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-sidebar p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <img src="https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/118c69a31_Trout.png" alt="FlyFishBud" className="w-5 h-5 object-contain [filter:invert(1)]" />
          </div>
          <div>
            <p className="font-heading font-semibold leading-tight">FlyFishBud</p>
            <p className="text-xs text-muted-foreground">Tackle Manager</p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <img src="https://media.base44.com/images/public/6a3f2458eb55a5d860886e35/118c69a31_Trout.png" alt="FlyFishBud" className="w-4 h-4 object-contain [filter:invert(1)]" />
          </div>
          <span className="font-heading font-semibold">FlyFishBud</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-sidebar p-4 pt-16" onClick={(e) => e.stopPropagation()}>
            <NavLinks />
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground mt-4" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
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