import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Cloud, Loader2, CheckCircle2, AlertCircle, CloudUpload, Link2, Unlink } from "lucide-react";

const CONNECTOR_ID = "6a3f4eea83dab3778fd36181";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [autosave, setAutosave] = useState(() => localStorage.getItem("autosave") === "true");
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem("lastBackup") || null);
  const [error, setError] = useState(null);

  const checkConnection = async () => {
    try {
      const res = await base44.functions.invoke("cloudBackup", { mode: "check" });
      if (res.data?.error) {
        setConnected(false);
      } else {
        setConnected(true);
      }
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await checkConnection();
      }
      setLoading(false);
    });
  }, []);

  const handleConnect = async () => {
    setError(null);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 500);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleBackup = async () => {
    setBacking(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("cloudBackup", { mode: "backup" });
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

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your cloud backup preferences.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-semibold">Cloud Backup</h2>
            <p className="text-sm text-muted-foreground">Save your inventory to your own OneDrive folder.</p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            {connected ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-medium">OneDrive connected</span>
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
              <Link2 className="w-4 h-4" /> Connect OneDrive
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

      <p className="text-xs text-muted-foreground">
        Backups are saved as CSV files in a "FlyFish" folder in your OneDrive. Each backup overwrites the same dated files.
      </p>
    </div>
  );
}