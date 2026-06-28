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

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildGalleryHTML({ title, summary, images }) {
  const thumbs = images
    .map(
      (src, i) => `
      <figure class="thumb" data-index="${i}">
        <img src="${src}" alt="Photo ${i + 1}" loading="lazy" />
      </figure>`
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; }
  header { padding: 28px 20px 8px; text-align: center; }
  header h1 { margin: 0 0 6px; font-size: 22px; }
  header p { margin: 0; color: #475569; font-size: 14px; white-space: pre-wrap; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; padding: 20px; max-width: 920px; margin: 0 auto; }
  .thumb { margin: 0; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.15); aspect-ratio: 1; background: #e2e8f0; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .2s; }
  .thumb:hover img { transform: scale(1.04); }
  .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: none; align-items: center; justify-content: center; z-index: 100; }
  .lightbox.open { display: flex; }
  .lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.15); color: #fff; border: none; width: 48px; height: 48px; border-radius: 50%; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .nav:hover { background: rgba(255,255,255,.3); }
  .nav.prev { left: 14px; }
  .nav.next { right: 14px; }
  .close { position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,.15); color: #fff; border: none; width: 44px; height: 44px; border-radius: 50%; font-size: 24px; cursor: pointer; }
  .count { position: absolute; top: 20px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 14px; }
  footer { text-align: center; padding: 8px 20px 30px; color: #94a3b8; font-size: 12px; }
</style>
</head>
<body>
  <header>
    <h1>${esc(title)}</h1>
    ${summary ? `<p>${esc(summary)}</p>` : ""}
  </header>
  <div class="grid" id="grid">${thumbs}</div>
  <div class="lightbox" id="lightbox">
    <button class="close" id="close" aria-label="Close">&times;</button>
    <div class="count" id="count"></div>
    <button class="nav prev" id="prev" aria-label="Previous">&#8249;</button>
    <img id="full" src="" alt="" />
    <button class="nav next" id="next" aria-label="Next">&#8250;</button>
  </div>
  <footer>Tap any photo to view it full size. Use arrows or swipe to browse.</footer>
<script>
  (function () {
    var imgs = Array.prototype.map.call(document.querySelectorAll('.thumb img'), function (i) { return i.src; });
    var idx = 0;
    var box = document.getElementById('lightbox');
    var full = document.getElementById('full');
    var count = document.getElementById('count');
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      full.src = imgs[idx];
      count.textContent = (idx + 1) + ' / ' + imgs.length;
      box.classList.add('open');
    }
    Array.prototype.forEach.call(document.querySelectorAll('.thumb'), function (t) {
      t.addEventListener('click', function () { show(parseInt(t.dataset.index, 10)); });
    });
    document.getElementById('prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    document.getElementById('next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    document.getElementById('close').addEventListener('click', function () { box.classList.remove('open'); });
    box.addEventListener('click', function (e) { if (e.target === box) box.classList.remove('open'); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'Escape') box.classList.remove('open');
    });
    var sx = 0;
    box.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();
</script>
</body>
</html>`;
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
    try {
      // Fetch each photo and embed it as a data URL so the page is self-contained
      const results = await Promise.allSettled(
        photos.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error("fetch failed");
          const blob = await res.blob();
          return blobToDataURL(blob);
        })
      );
      const images = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      if (images.length === 0) throw new Error("Could not load photos");

      const html = buildGalleryHTML({ title, summary, images });
      const file = new File([html], `${title}.html`, { type: "text/html" });

      // 1. Native share with the webpage file
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title, text: summary, files: [file] });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      // 2. Native text share with photo links
      const linkText = [summary, ...photos].filter(Boolean).join("\n");
      try {
        if (navigator.share) {
          await navigator.share({ title, text: linkText });
          return;
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
      }

      // 3. Fallback: save the webpage + copy links
      downloadBlob(file, file.name);
      try {
        await navigator.clipboard.writeText(linkText);
        toast.success("Webpage saved & links copied");
      } catch {
        toast.success("Webpage saved to your device");
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
      toast.error("Could not share photos");
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