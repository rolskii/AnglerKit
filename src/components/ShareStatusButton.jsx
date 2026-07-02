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

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildStatusHTML(title, text) {
  const lines = String(text ?? "")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<div class="line">${esc(l)}</div>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #eef2f6; color: #0f172a; padding: 20px; }
  .card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15,23,42,.08); overflow: hidden; }
  .body { padding: 22px; display: flex; flex-direction: column; gap: 14px; }
  .head h1 { margin: 0; font-size: 20px; line-height: 1.3; }
  .lines { display: flex; flex-direction: column; gap: 10px; }
  .line { font-size: 15px; line-height: 1.5; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
  .line:last-child { border-bottom: none; }
  footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 14px 0 4px; }
</style>
</head>
<body>
  <div class="card">
    <div class="body">
      <div class="head"><h1>${esc(title)}</h1></div>
      <div class="lines">${lines}</div>
    </div>
  </div>
  <footer>Shared from Angler's Log</footer>
</body>
</html>`;
}

export default function ShareStatusButton({ title, text }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    setBusy(true);
    const summary = `${title}\n\n${text}`;
    try {
      const html = buildStatusHTML(title, text);
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
        toast.success("Status webpage saved & copied to clipboard");
      } catch {
        toast.success("Status webpage saved to your device");
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