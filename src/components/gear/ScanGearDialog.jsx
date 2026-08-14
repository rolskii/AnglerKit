import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Sparkles, Loader2, AlertTriangle, X, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  GEAR_CATEGORY_META, GEAR_EXTRACTION_SCHEMA, GEAR_EXTRACTION_PROMPT,
  mapExtractionToPrefill, resolveCategory,
} from "@/lib/gearScan";

// Up to this many photos of the same item can be staged before scanning —
// extra angles help the AI read labels a single photo might miss, but the
// grid below is tuned for a small number of thumbnails.
const MAX_PHOTOS = 5;

// Resize the photo's longest side down to 1600px (if larger) and re-encode
// as JPEG. Kept less aggressive than the general ImageUpload compressor so
// small print on labels/boxes stays legible to the AI.
function prepareForScan(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" })),
        "image/jpeg",
        0.9
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

let nextPhotoId = 0;

export default function ScanGearDialog({ open, onOpenChange }) {
  const [photos, setPhotos] = useState([]); // { id, file, previewUrl }
  const [status, setStatus] = useState("idle"); // idle | uploading | identifying | error
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const navigate = useNavigate();

  const revokeAll = (list) => {
    list.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  };

  const reset = () => {
    setPhotos((prev) => { revokeAll(prev); return []; });
    setStatus("idle");
    setErrorMsg("");
  };

  const handleOpenChange = (o) => {
    if (status === "uploading" || status === "identifying") return; // don't allow closing mid-scan
    if (!o) reset();
    onOpenChange(o);
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (room <= 0) {
        toast.info(`You can scan up to ${MAX_PHOTOS} photos at once.`);
        return prev;
      }
      const accepted = incoming.slice(0, room);
      if (incoming.length > accepted.length) {
        toast.info(`Only added ${accepted.length} — up to ${MAX_PHOTOS} photos at once.`);
      }
      const added = accepted.map((file) => ({
        id: nextPhotoId++,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...added];
    });
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleIdentify = async () => {
    if (photos.length === 0) return;
    try {
      setStatus("uploading");
      setErrorMsg("");
      const fileUrls = await Promise.all(
        photos.map(async ({ file }) => {
          const prepared = await prepareForScan(file);
          const { file_url } = await base44.integrations.Core.UploadFile({ file: prepared });
          return file_url;
        })
      );
      if (fileUrls.some((u) => !u)) throw new Error("Upload did not return a file URL");

      setStatus("identifying");
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: GEAR_EXTRACTION_PROMPT,
        file_urls: fileUrls,
        response_json_schema: GEAR_EXTRACTION_SCHEMA,
      });
      // Base44 may return the parsed object directly, or nested under `.output`/`.data`
      // depending on SDK version — handle both shapes defensively.
      const data = result?.output ?? result?.data ?? result ?? {};

      const category = resolveCategory(data);
      const meta = GEAR_CATEGORY_META[category];
      const prefill = mapExtractionToPrefill(category, data, fileUrls);

      onOpenChange(false);
      reset();
      navigate(meta.path, { state: { prefill } });

      const label = data.identified_as || meta.label;
      if (category === "misc" && (!data.category || data.category === "misc")) {
        toast.success(`Photos uploaded — review the details before saving.`);
      } else {
        toast.success(`Looks like a ${label}. Review and save to add it.`);
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg(e?.message || "Something went wrong identifying that gear.");
    }
  };

  const working = status === "uploading" || status === "identifying";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Scan Gear
          </DialogTitle>
          <DialogDescription>
            Snap or choose one or more photos of a rod, reel, fly line box, fly/lure, or other gear —
            extra angles help us read labels — and we'll identify it and prefill a new entry for you to review.
          </DialogDescription>
        </DialogHeader>

        {working ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {status === "uploading"
                ? `Uploading ${photos.length > 1 ? `${photos.length} photos` : "photo"}…`
                : "Identifying gear…"}
            </p>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>Try again</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                      aria-label="Remove photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    aria-label="Add another photo"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button type="button" variant={photos.length ? "outline" : "default"} onClick={() => cameraRef.current?.click()}>
                <Camera className="w-4 h-4 mr-2" />
                {photos.length ? "Take another photo" : "Take photo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose photo{photos.length ? "s" : "(s)"}
              </Button>
              {photos.length > 0 && (
                <Button type="button" onClick={handleIdentify}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Identify Gear{photos.length > 1 ? ` (${photos.length} photos)` : ""}
                </Button>
              )}
            </div>
          </div>
        )}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
      </DialogContent>
    </Dialog>
  );
}
