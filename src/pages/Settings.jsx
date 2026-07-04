import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeftRight, Trash2, BellOff } from "lucide-react";
import ImportExportSection from "@/components/settings/ImportExportSection";
import AlarmSoundPicker from "@/components/settings/AlarmSoundPicker";
import { clearFiredAlarms } from "@/lib/alarmService";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    <div className="space-y-6 md:space-y-8 -mt-4 md:-mt-8 max-w-2xl">
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

      <div className="rounded-lg border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <BellOff className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Alarms</h2>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Alarm Sound</p>
            <p className="text-xs text-muted-foreground">Choose the sound played when a feeding-time alarm triggers.</p>
          </div>
          <AlarmSoundPicker />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Remove all saved fishing alarms from this device.</p>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("alarmsByDate");
              clearFiredAlarms();
              toast.success("All alarms cleared");
            }}
            className="flex items-center gap-2"
          >
            <BellOff className="w-4 h-4" /> Clear All Alarms
          </Button>
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