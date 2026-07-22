import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sun, Moon, ArrowLeftRight, BellRing, Ruler } from "lucide-react";
import { useUnits } from "@/lib/unitsContext";
import ImportExportSection from "@/components/settings/ImportExportSection";
import NotificationSetup from "@/components/settings/NotificationSetup";
import AlarmSoundPicker from "@/components/settings/AlarmSoundPicker";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const { system, setUnitSystem } = useUnits();

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Sign in to manage your settings.</p>
        <Button onClick={() => base44.auth.redirectToLogin()}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your import/export and appearance.</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Import / Export</h2>
        </div>
        <ImportExportSection />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <BellRing className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Fishing Alarms</h2>
        </div>
        <div className="space-y-4">
          <NotificationSetup />
          <div>
            <p className="text-sm font-medium mb-2">Alarm sound</p>
            <AlarmSoundPicker />
          </div>
        </div>
      </div>

      <div className="rounded-lg border-0 bg-primary/10 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold">Units</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">Choose between metric and imperial measurements across the app.</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setUnitSystem("metric")}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
              system === "metric" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <span className={`text-sm font-semibold ${system === "metric" ? "text-primary" : ""}`}>Metric</span>
            <span className="text-xs text-muted-foreground">°C, cm, kg, m</span>
          </button>
          <button
            onClick={() => setUnitSystem("imperial")}
            className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
              system === "imperial" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <span className={`text-sm font-semibold ${system === "imperial" ? "text-primary" : ""}`}>Imperial</span>
            <span className="text-xs text-muted-foreground">°F, in, lb, ft</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border-0 bg-primary/10 p-6 space-y-4">
        <div>
          <h2 className="font-heading font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Choose between light and dark mode.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => applyTheme("light")}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              theme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Sun className="w-5 h-5" />
            </div>
            <span className={`text-sm font-medium ${theme === "light" ? "text-primary" : ""}`}>Light</span>
          </button>
          <button
            onClick={() => applyTheme("dark")}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              theme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Moon className="w-5 h-5" />
            </div>
            <span className={`text-sm font-medium ${theme === "dark" ? "text-primary" : ""}`}>Dark</span>
          </button>
        </div>
      </div>
    </div>
  );
}