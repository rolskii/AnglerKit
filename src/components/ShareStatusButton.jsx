import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function safeFileName(s) {
  const cleaned = String(s ?? "")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Anglers-Log";
}

export default function ShareStatusButton({ title, text }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    const summary = `${title}\n\n${text}`;
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title, text });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      const file = new File([text], `${safeFileName(title)}.txt`, { type: "text/plain" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title, text: summary, files: [file] });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      downloadBlob(file, file.name);
      try {
        await navigator.clipboard.writeText(summary);
        toast.success("Status saved & copied to clipboard");
      } catch {
        toast.success("Status saved to your device");
      }
    } catch (e) {
      if (e?.name !== "AbortError") toast.error("Could not share");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="sm" variant="outline" className="flex-1" onClick={handleShare} disabled={busy}>
      {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5 mr-1.5" />}
      Share
    </Button>
  );
}