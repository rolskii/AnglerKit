import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ShareButton({ targetRef, title = "Angler's Log", summary, photoUrls = [] }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    const el = targetRef?.current;
    if (!el) return;
    setBusy(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("render failed");
      const file = new File([blob], `${title}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: summary, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title, text: summary });
        downloadBlob(blob, `${title}.png`);
      } else {
        downloadBlob(blob, `${title}.png`);
        toast.success("Card image saved to your device");
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
      // Fallback: share text with photo links (e.g. if canvas export is blocked)
      try {
        const text = [summary, ...photoUrls].filter(Boolean).join("\n");
        if (navigator.share) {
          await navigator.share({ title, text });
        } else {
          await navigator.clipboard.writeText(text);
          toast.success("Card details copied to clipboard");
        }
      } catch (e2) {
        if (e2?.name !== "AbortError") toast.error("Could not share card");
      }
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

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}