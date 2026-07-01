import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sun, Moon, Monitor, ArrowLeftRight, Trash2 } from "lucide-react";
import ImportExportSection from "@/components/settings/ImportExportSection";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem("theme", t);
    const isDark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      localStorage.clear();
      await base44.auth.logout();
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
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

      <div className="rounded-lg border-0 bg-primary/10 p-6 space-y-4">
        <div>
          <h2 className="font-heading font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Choose between light, dark, or system mode.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
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
          <button
            onClick={() => applyTheme("system")}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              theme === "system" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent/50"
            }`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-md ${theme === "system" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Monitor className="w-5 h-5" />
            </div>
            <span className={`text-sm font-medium ${theme === "system" ? "text-primary" : ""}`}>System</span>
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-destructive">Account Deletion</h2>
          <p className="text-sm text-muted-foreground">Permanently delete your account and sign out. This action cannot be undone.</p>
        </div>
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="flex items-center gap-2">
          <Trash2 className="w-4 h-4" /> Delete My Account
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently sign you out and clear all local data from this device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}