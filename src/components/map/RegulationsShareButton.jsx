import React, { useRef, useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { buildRegulationsShareCardHtml } from "@/lib/regulationsShareCard";
import { fetchAsDataUrl } from "@/lib/imageDataUrl";
import { APP_LOGO_URL } from "@/components/AppLogo";

// Shares the regulations summary as a self-contained HTML card (with clickable
// official links at the bottom) — the recipient doesn't need the app.
export default function RegulationsShareButton({ data }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const shareLockRef = useRef(false);
  const lastShareAtRef = useRef(0);
  const regs = data?.regulations;

  const handleShare = async () => {
    if (!regs || shareLockRef.current) return;
    // iOS can fire two click events for a single tap, and a quick double-tap
    // re-enters before the busy state re-renders — a synchronous lock plus a
    // short cooldown keeps the card from being shared twice.
    if (Date.now() - lastShareAtRef.current < 2000) return;
    shareLockRef.current = true;
    lastShareAtRef.current = Date.now();
    setBusy(true);
    const summaryText = [
      regs.areaLabel ? `Fishing regulations — ${regs.areaLabel}` : "Fishing regulations",
      ...(regs.links || []).map((l) => l.url),
    ].join("\n");
    try {
      // Embed the app logo as base64 — remote image URLs are blocked in
      // some file previews, data URLs always render.
      const logoDataUrl = await fetchAsDataUrl(APP_LOGO_URL);
      const html = await buildRegulationsShareCardHtml(regs, logoDataUrl);
      const fileName = `regulations-${(regs.areaLabel || "summary").replace(/[^\w]+/g, "-").slice(0, 40).toLowerCase()}.html`;
      const file = new File([html], fileName, { type: "text/html" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: "Fishing Regulations", text: summaryText, files: [file] });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      // Fallback: save the card file and copy the official links.
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      try {
        await navigator.clipboard.writeText(summaryText);
        toast({ title: "Regulations card saved", description: "Official links copied to the clipboard." });
      } catch {
        toast({ title: "Regulations card saved to your device" });
      }
    } catch (e) {
      toast({ title: "Could not create the regulations card" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={busy}
      className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground"
      aria-label="Share regulations card"
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
    </button>
  );
}