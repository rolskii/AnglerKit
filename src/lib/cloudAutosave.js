import { base44 } from "@/api/base44Client";

export async function triggerAutosave() {
  if (localStorage.getItem("autosave") !== "true") return;
  try {
    const res = await base44.functions.invoke("cloudBackup", { mode: "backup" });
    if (!res.data?.error) {
      localStorage.setItem("lastBackup", new Date().toISOString());
    }
  } catch (_) {
    // silent — autosave is best-effort
  }
}