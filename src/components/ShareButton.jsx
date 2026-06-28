import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export default function ShareButton({ targetRef, title = "Angler's Log", summary, photoUrls = [] }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    const el = targetRef?.current;
    if (!el) return;
    setBusy(true);
    try {
      let blob = null;
      try {
        const canvas = await html2canvas(el, {
          backgroundColor: "#ffffff",
          scale: 2,
          useCORS: true,
          logging: false,
          ignoreElements: (node) => node?.hasAttribute?.("data-html2canvas-ignore"),
        });
        blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      } catch (e) {
        blob = null;
      }

      const text = [summary, ...photoUrls].filter(Boolean).join("\n");

      // 1. Native share with the card image (mobile share sheet)
      if (blob) {
        const file = new File([blob], `${title}.png`, { type: "image/png" });
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title, text: summary, files: [file] });
            return;
          }
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      // 2. Native text share (includes photo links)
      try {
        if (navigator.share) {
          await navigator.share({ title, text });
          if (blob) downloadBlob(blob, `${title}.png`);
          return;
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
      }

      // 3. Fallback: save image + copy details
      if (blob) downloadBlob(blob, `${title}.png`);
      try {
        await navigator.clipboard.writeText(text);
        toast.success(blob ? "Card image saved & details copied" : "Card details copied");
      } catch {
        toast.success(blob ? "Card image saved to your device" : "Could not share card");
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