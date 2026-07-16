import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

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
  return cleaned || "AnglerKit";
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildScreenshotHTML(title, imgDataUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #eef2f6; color: #0f172a; padding: 20px; }
  .card { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15,23,42,.08); overflow: hidden; }
  .card img { width: 100%; display: block; }
  footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 14px 0 4px; }
</style>
</head>
<body>
  <div class="card">
    <img src="${imgDataUrl}" alt="${esc(title)}" />
  </div>
  <footer>Shared from AnglerKit</footer>
</body>
</html>`;
}

export default function ShareStatusButton({ title, text, targetRef }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    if (!targetRef?.current) {
      toast.error("Nothing to share yet");
      return;
    }
    setBusy(true);
    const summary = `${title}\n\n${text}`;
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgDataUrl = canvas.toDataURL("image/png");
      const html = buildScreenshotHTML(title, imgDataUrl);
      const file = new File([html], `${safeFileName(title)}.html`, { type: "text/html" });

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
        toast.success("Snapshot saved & copied to clipboard");
      } catch {
        toast.success("Snapshot saved to your device");
      }
    } catch (e) {
      toast.error("Could not capture screen");
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