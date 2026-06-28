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

export default function ShareButton({ title = "Angler's Log", summary, photoUrls = [] }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    const photos = (photoUrls || []).filter(Boolean);
    if (photos.length === 0) {
      toast.error("No photos to share");
      return;
    }
    setBusy(true);
    const linkText = [summary, ...photos].filter(Boolean).join("\n");
    try {
      // Fetch each photo as a real file (tolerate individual failures)
      const results = await Promise.allSettled(
        photos.map(async (url, idx) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error("fetch failed");
          const blob = await res.blob();
          const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
          return new File([blob], `${title}-${idx + 1}.${ext}`, {
            type: blob.type || "image/jpeg",
          });
        })
      );
      const files = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

      // 1. Native share with all image files (mobile share sheet)
      if (files.length > 0 && navigator.canShare?.({ files })) {
        try {
          await navigator.share({ title, text: summary, files });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      // 2. Native text share with photo links
      try {
        if (navigator.share) {
          await navigator.share({ title, text: linkText });
          return;
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
      }

      // 3. Fallback: save the photo files + copy links
      if (files.length > 0) {
        files.forEach((file) => downloadBlob(file, file.name));
      }
      try {
        await navigator.clipboard.writeText(linkText);
        toast.success(files.length ? "Photos saved & links copied" : "Photo links copied");
      } catch {
        toast.success(files.length ? "Photos saved to your device" : "Could not share photos");
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(linkText);
        toast.success("Photo links copied to clipboard");
      } catch {
        toast.error("Could not share photos");
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