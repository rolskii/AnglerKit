import React, { useRef, useState } from "react";
import { Share2, Loader2, ScrollText } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/components/ui/use-toast";

// Offscreen card rendered for html2canvas — plain light-theme styling so it
// looks the same no matter the app's dark/light mode.
function RegulationsShareCard({ regs, cardRef }) {
  return (
    <div
      ref={cardRef}
      className="w-[620px] rounded-2xl bg-white p-6 text-slate-900"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e5aa8] text-white">
          <ScrollText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-bold leading-tight">Fishing Regulations</div>
          <div className="text-sm text-slate-500">{regs.areaLabel}</div>
        </div>
      </div>

      {regs.waterbody?.speciesSummary && (
        <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-teal-700">
            Species in this waterbody
          </div>
          <div className="mt-1 text-sm leading-snug">{regs.waterbody.speciesSummary}</div>
        </div>
      )}

      {regs.seasons?.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Open seasons &amp; limits
          </div>
          <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
            {regs.seasons.map((s, i) => (
              <div
                key={i}
                className={`px-3 py-2 ${i > 0 ? "border-t border-slate-200" : ""} ${i % 2 ? "bg-slate-50" : "bg-white"}`}
              >
                <div className="text-sm font-semibold leading-snug">{s.species}</div>
                <div className="text-xs text-slate-500">Season: {s.season}</div>
                <div className="text-xs">Limits: {s.limit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {regs.generalRules?.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Key rules
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {regs.generalRules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-snug">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e5aa8]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {regs.exceptionsNote && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm leading-snug">
          {regs.exceptionsNote}
        </div>
      )}

      {/* Official links at the bottom of the card */}
      {regs.links?.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Official sources
          </div>
          {regs.links.map((l, i) => (
            <div key={i} className="mt-1.5">
              <div className="text-sm font-semibold leading-snug">{l.label}</div>
              <div className="break-all text-xs text-slate-500">{l.url}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-slate-200 pt-3 text-[11px] text-slate-400">
        Shared from AnglerKit{regs.source === "ai" ? " — AI-generated summary" : ""}. Always verify
        with the official sources before fishing.
      </div>
    </div>
  );
}

// Renders the regulations summary as a shareable card image (official links
// printed at the bottom) and hands it to the phone's share sheet, with a
// save-to-device + copy-links fallback.
export default function RegulationsShareButton({ data }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);
  const regs = data?.regulations;

  const handleShare = async () => {
    if (!regs || busy) return;
    setBusy(true);
    const summaryText = [
      regs.areaLabel ? `Fishing regulations — ${regs.areaLabel}` : "Fishing regulations",
      ...(regs.links || []).map((l) => l.url),
    ].join("\n");
    try {
      // Give the offscreen card a beat to fully paint before capture.
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Capture failed");
      const fileName = `regulations-${(regs.areaLabel || "summary").replace(/[^\w]+/g, "-").slice(0, 40).toLowerCase()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: "Fishing Regulations", text: summaryText, files: [file] });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      // Fallback: save the card image and copy the official links.
      const url = URL.createObjectURL(blob);
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
    <>
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        className="p-1.5 rounded-lg hover:bg-accent/10 text-muted-foreground"
        aria-label="Share regulations card"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
      </button>
      {/* Offscreen render target for the card image capture */}
      <div className="fixed" style={{ left: -10000, top: 0 }} aria-hidden="true">
        {regs && <RegulationsShareCard regs={regs} cardRef={cardRef} />}
      </div>
    </>
  );
}