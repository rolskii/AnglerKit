import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      // Fetch each photo as a real file so the recipient can view them all
      const files = await Promise.all(
        photos.map(async (url, idx) => {
          const res = await fetch(url);
          const blob = await res.blob();
          const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
          return new File([blob], `${title}-${idx + 1}.${ext}`, {
            type: blob.type || "image/jpeg",
          });
        })
      );

      // 1. Native share with all image files (mobile share sheet)
      if (navigator.canShare?.({ files })) {
        await navigator.share({ title, text: summary, files });
        return;
      }

      // 2. Native text share with photo links
      if (navigator.share) {
        await navigator.share({ title, text: linkText });
        return;
      }

      // 3. Fallback: copy details + photo links
      await navigator.clipboard.writeText(linkText);
      toast.success("Card details & photo links copied");
    } catch (e) {
      if (e?.name === "AbortError") return;
      // Fallback: share/copy text with links
      try {
        if (navigator.share) {
          await navigator.share({ title, text: linkText });
        } else {
          await navigator.clipboard.writeText(linkText);
          toast.success("Card details & photo links copied");
        }
      } catch (e2) {
        if (e2?.name !== "AbortError") toast.error("Could not share photos");
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