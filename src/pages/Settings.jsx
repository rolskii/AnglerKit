import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle, CloudUpload, Link2, Unlink, HardDrive, Cloud, Box, Sun, Moon } from "lucide-react";

const SERVICES = {
  onedrive: { id: "6a3f4eea83dab3778fd36181", label: "OneDrive", icon: Cloud, folder: "FlyFish folder in your OneDrive" },
  gdrive: { id: "6a3f50032d295a9447877a15", label: "Google Drive", icon: HardDrive, folder: "Your Google Drive (app-created files)" },
  dropbox: { id: "6a3f50054d07d36c92f3b0aa", label: "Dropbox", icon: Box, folder: "/FlyFish folder in your Dropbox" },
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [service, setService] = useState(() => localStorage.getItem("cloudService") || "onedrive");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [autosave, setAutosave] = useState(() => localStorage.getItem("autosave") === "true");
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem("lastBackup") || null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [appName, setAppName] = useState(() => localStorage.getItem("appName") || "My Fly Guy");

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (t === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const checkConnection = async (svc) => {
    try {
      const res = await base44.functions.invoke("cloudBackup", { mode: "check", service: svc });
      setConnected(!res.data?.error);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await checkConnection(service);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectService = async (svc) => {
    setService(svc);
    localStorage.setItem("cloudService", svc);
    setConnected(false);
    setError(null);
    await checkConnection(svc);
  };

  const handleConnect = async () => {
    setError(null);
    try {
      const url = await base44.connectors.connectAppUser(SERVICES[service].id);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection(service);
        }
      }, 500);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await base44.connectors.disconnectAppUser(SERVICES[service].id);
      setConnected(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleBackup = async () => {
    setBacking(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("cloudBackup", { mode: "backup", service });
      if (res.data?.error) throw new Error(res.data.error);
      const ts = res.data.backed_up_at || new Date().toISOString();
      setLastBackup(ts);
      localStorage.setItem("lastBackup", ts);
    } catch (e) {
      setError(e.message);
    } finally {
      setBacking(false);
    }
  };

  const toggleAutosave = (v) => {
    setAutosave(v);
    localStorage.setItem("autosave", String(v));
  };

  const handleAppNameChange = (v) => {
    setAppName(v);
    localStorage.setItem("appName", v);
  };

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
        <p className="text-muted-foreground">Sign in to manage cloud backup.</p>
        <Button onClick={() => base44.auth.redirectToLogin()}>Sign in</Button>
      </div>
    );
  }

  const ActiveIcon = SERVICES[service].icon;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your cloud backup preferences.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div>
          <h2 className="font-heading font-semibold mb-1">Choose your cloud service</h2>
          <p className="text-sm text-muted-foreground mb-3">Pick where your inventory backups are stored. You connect your own account.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(SERVICES).map(([key, svc]) => {
              const Icon = svc.icon;
              const active = service === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectService(key)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    active ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-md ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-medium ${active ? "text-primary" : ""}`}>{svc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-medium">{SERVICES[service].label} connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Not connected</span>
              </>
            )}
          </div>
          {connected ? (
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <Unlink className="w-4 h-4" /> Disconnect
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleConnect}>
              <Link2 className="w-4 h-4" /> Connect {SERVICES[service].label}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Autosave</p>
            <p className="text-xs text-muted-foreground">Automatically back up after every change to your inventory.</p>
          </div>
          <button
            role="switch"
            aria-checked={autosave}
            disabled={!connected}
            onClick={() => toggleAutosave(!autosave)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${autosave ? "bg-primary" : "bg-muted"} ${!connected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${autosave ? "translate-x-5" : ""}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {lastBackup ? (
              <>Last backup: {new Date(lastBackup).toLocaleString()}</>
            ) : (
              <>No backups yet</>
            )}
          </div>
          <Button onClick={handleBackup} disabled={!connected || backing}>
            {backing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            Back up now
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <ActiveIcon className="w-3.5 h-3.5" />
        Backups are saved as CSV files in your {SERVICES[service].folder}.
      </p>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-heading font-semibold">App Name</h2>
          <p className="text-sm text-muted-foreground mb-3">Customize the name displayed in the app.</p>
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Enter app name"
            />
            <Button onClick={() => handleAppNameChange(appName)}>Save</Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
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