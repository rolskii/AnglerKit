import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Sun, Moon, Monitor, ArrowLeftRight, BellRing, Ruler, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import { useUnits } from "@/lib/unitsContext";
import ImportExportSection from "@/components/settings/ImportExportSection";
import NotificationSetup from "@/components/settings/NotificationSetup";
import AlarmSoundPicker from "@/components/settings/AlarmSoundPicker";
import { toast } from "sonner";
import { seedSampleData, deleteSampleData, getSampleDataCount } from "@/lib/sampleData";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");
  const { system, setUnitSystem } = useUnits();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);

  const refreshSampleCount = () => setSampleCount(getSampleDataCount());

  useEffect(() => { refreshSampleCount(); }, []);

  const loadSamples = async () => {
    setSeeding(true);
    try {
      const { total } = await seedSampleData();
      toast.success(`Added ${total} sample items to your account`);
      refreshSampleCount();
    } catch (e) {
      toast.error(e.message || "Failed to load sample data");
    } finally {
      setSeeding(false);
    }
  };

  const purgeSamples = async () => {
    setPurging(true);
    try {
      const n = await deleteSampleData();
      toast.success(`Removed ${n} sample items from your account`);
      refreshSampleCount();
    } catch (e) {
      toast.error(e.message || "Failed to remove sample data");
    } finally {
      setPurging(false);
      setPurgeOpen(false);
    }
  };

  const resolveDark = (t) => {
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    if (resolveDark(t)) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteAccount", {});
      toast.success("Account deleted");
      await base44.auth.logout("/");
    } catch (e) {
      toast.error(e.message || "Failed to delete account");
      setDeleting(false);
      setDeleteOpen(false);
      setDeleteConfirm("");
    }
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
          <p className="text-sm text-muted-foreground">Choose between light, dark, or system mode.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => applyTheme("light")}
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
              theme === "light" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${theme === "light" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Sun className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium ${theme === "light" ? "text-primary" : ""}`}>Light</span>
          </button>
          <button
            onClick={() => applyTheme("dark")}
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
              theme === "dark" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${theme === "dark" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Moon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium ${theme === "dark" ? "text-primary" : ""}`}>Dark</span>
          </button>
          <button
            onClick={() => applyTheme("system")}
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors ${
              theme === "system" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${theme === "system" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Monitor className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium ${theme === "system" ? "text-primary" : ""}`}>System</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold">Sample Data</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Load a starter set of sample rods, reels, lines, flies, gear, supplies, and catches into your account. This only adds copies to your own collection — delete any items you don't want.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={loadSamples} disabled={seeding}>
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Load sample data
          </Button>
          {sampleCount > 0 && (
            <Button variant="outline" onClick={() => setPurgeOpen(true)} disabled={purging}>
              {purging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remove sample data ({sampleCount})
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          "Remove sample data" deletes only the items added by "Load sample data" on this device — your own gear and catches are never touched.
        </p>
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h2 className="font-heading font-semibold text-destructive">Delete Account</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Permanently erase your account and all associated data, including gear logs, catch records, and photos. This action cannot be undone.
        </p>
        <Button variant="destructive" onClick={() => { setDeleteConfirm(""); setDeleteOpen(true); }}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
        </Button>
      </div>

      <AlertDialog open={purgeOpen} onOpenChange={setPurgeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove sample data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This deletes only the {sampleCount} sample items that were added by "Load sample data" on this device. Your own gear and catches are not affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purging}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={purgeSamples}
              disabled={purging}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {purging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remove {sampleCount} items
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteConfirm(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently erases all gear logs, catch records, photos, and settings. This action cannot be undone. Type <span className="font-bold text-destructive">DELETE</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== "DELETE" || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}