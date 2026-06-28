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
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function val(v) {
  return v != null && v !== "" ? esc(v) : "—";
}

function buildCardHTML(card, images) {
  const title = card.title || "Angler's Log";
  const details = (card.details || [])
    .map(
      (d) => `<div class="detail"><span class="lbl">${esc(d.label)}</span><span class="val">${val(d.value)}</span></div>`
    )
    .join("");
  const sections = (card.sections || [])
    .map((s) => {
      const items = (s.items || [])
        .map(
          (it) => `
        <li class="item">
          <div class="item-name">${esc(it.name)}</div>
          ${(it.sub || [])
            .map(
              (sd) =>
                `<div class="detail sm"><span class="lbl">${esc(sd.label)}</span><span class="val">${val(sd.value)}</span></div>`
            )
            .join("")}
          ${it.description ? `<p class="muted desc">${esc(it.description)}</p>` : ""}
          ${it.notes ? `<p class="muted desc italic">${esc(it.notes)}</p>` : ""}
        </li>`
        )
        .join("");
      return `
        <div class="section">
          <div class="section-title">${esc(s.title)}</div>
          ${s.note ? `<p class="muted">${esc(s.note)}</p>` : ""}
          ${items ? `<ul class="item-list">${items}</ul>` : ""}
        </div>`;
    })
    .join("");
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
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #eef2f6; color: #0f172a; padding: 20px; }
  .card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(15,23,42,.08); overflow: hidden; }
  .hero { width: 100%; max-height: 360px; object-fit: cover; display: block; background: #e2e8f0; cursor: pointer; }
  .body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .head h1 { margin: 0; font-size: 20px; line-height: 1.2; }
  .head .sub { margin: 4px 0 0; color: #64748b; font-size: 13px; }
  .badge { flex-shrink: 0; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: #e2f4ee; color: #047857; }
  .details { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
  .detail { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid #f1f5f9; padding: 3px 0; font-size: 14px; }
  .detail.sm { font-size: 12px; }
  .lbl { color: #94a3b8; }
  .val { font-weight: 600; text-align: right; word-break: break-word; }
  .section { border-top: 1px solid #e2e8f0; padding-top: 12px; }
  .section-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
  .item-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #f8fafc; }
  .item-name { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
  .item .details { grid-template-columns: 1fr 1fr; }
  .muted { color: #64748b; font-size: 13px; margin: 4px 0 0; }
  .desc { font-size: 12px; }
  .italic { font-style: italic; }
  .notes { border-top: 1px solid #e2e8f0; padding-top: 10px; color: #64748b; font-style: italic; font-size: 13px; white-space: pre-wrap; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
  .thumb { margin: 0; border-radius: 8px; overflow: hidden; cursor: pointer; aspect-ratio: 1; background: #e2e8f0; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .2s; }
  .thumb:hover img { transform: scale(1.05); }
  .more { font-size: 12px; color: #64748b; margin-top: 2px; }
  .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.92); display: none; align-items: center; justify-content: center; z-index: 100; }
  .lightbox.open { display: flex; }
  .lightbox img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,.15); color: #fff; border: none; width: 46px; height: 46px; border-radius: 50%; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .nav:hover { background: rgba(255,255,255,.3); }
  .nav.prev { left: 14px; }
  .nav.next { right: 14px; }
  .close { position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,.15); color: #fff; border: none; width: 42px; height: 42px; border-radius: 50%; font-size: 24px; cursor: pointer; }
  .count { position: absolute; top: 18px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 14px; }
  footer { text-align: center; color: #94a3b8; font-size: 12px; padding: 14px 0 4px; }
</style>
</head>
<body>
  <div class="card">
    ${images[0] ? `<img class="hero" id="hero" src="${images[0]}" alt="Main photo" />` : ""}
    <div class="body">
      <div class="head">
        <div>
          <h1>${esc(title)}</h1>
          ${card.subtitle ? `<p class="sub">${esc(card.subtitle)}</p>` : ""}
        </div>
        ${card.badge ? `<span class="badge">${esc(card.badge)}</span>` : ""}
      </div>
      ${details ? `<div class="details">${details}</div>` : ""}
      ${sections}
      ${card.notes ? `<p class="notes">${esc(card.notes)}</p>` : ""}
      ${
        images.length > 1
          ? `<div class="section"><div class="section-title">Photos</div><div class="gallery" id="gallery">${thumbs}</div><p class="more">Tap any photo to view full size.</p></div>`
          : images.length === 1
          ? `<p class="more">Tap the photo to view full size.</p>`
          : ""
      }
    </div>
  </div>
  <div class="lightbox" id="lightbox">
    <button class="close" id="close" aria-label="Close">&times;</button>
    <div class="count" id="count"></div>
    <button class="nav prev" id="prev" aria-label="Previous">&#8249;</button>
    <img id="full" src="" alt="" />
    <button class="nav next" id="next" aria-label="Next">&#8250;</button>
  </div>
  <footer>Shared from Angler's Log</footer>
<script>
  (function () {
    var imgs = [];
    var hero = document.getElementById('hero');
    if (hero) imgs.push(hero.src);
    Array.prototype.forEach.call(document.querySelectorAll('.thumb img'), function (i) { imgs.push(i.src); });
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
    if (hero) hero.addEventListener('click', function () { show(0); });
    Array.prototype.forEach.call(document.querySelectorAll('.thumb'), function (t) {
      t.addEventListener('click', function () { show(parseInt(t.dataset.index, 10) + 1); });
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

export default function ShareButton({ card = {}, photoUrls = [] }) {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    const photos = (photoUrls || []).filter(Boolean);
    if (photos.length === 0) {
      toast.error("No photos to share");
      return;
    }
    setBusy(true);
    const summary = [card.title, card.subtitle].filter(Boolean).join(" — ");
    try {
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

      const html = buildCardHTML(card, images);
      const file = new File([html], `${card.title || "card"}.html`, { type: "text/html" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: card.title, text: summary, files: [file] });
          return;
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }

      const linkText = [summary, ...photos].filter(Boolean).join("\n");
      try {
        if (navigator.share) {
          await navigator.share({ title: card.title, text: linkText });
          return;
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
      }

      downloadBlob(file, file.name);
      try {
        await navigator.clipboard.writeText(linkText);
        toast.success("Card webpage saved & links copied");
      } catch {
        toast.success("Card webpage saved to your device");
      }
    } catch (e) {
      if (e?.name === "AbortError") return;
      toast.error("Could not share card");
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