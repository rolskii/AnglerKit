import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  GEAR_CATEGORY_META, GEAR_EXTRACTION_SCHEMA, mapExtractionToPrefill, resolveCategory,
} from "@/lib/gearScan";

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

export default function ScanGearDialog({ open, onOpenChange }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | identifying | error
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const navigate = useNavigate();

  const reset = () => {
    setStatus("idle");
    setErrorMsg("");
  };

  const handleOpenChange = (o) => {
    if (status === "uploading" || status === "identifying") return; // don't allow closing mid-scan
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFile = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    try {
      setStatus("uploading");
      setErrorMsg("");
      const prepared = await prepareForScan(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: prepared });
      if (!file_url) throw new Error("Upload did not return a file URL");

      setStatus("identifying");
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: GEAR_EXTRACTION_SCHEMA,
      });
      // Base44 may return the parsed object directly, or nested under `.output`/`.data`
      // depending on SDK version — handle both shapes defensively.
      const data = result?.output ?? result?.data ?? result ?? {};

      const category = resolveCategory(data);
      const meta = GEAR_CATEGORY_META[category];
      const prefill = mapExtractionToPrefill(category, data, file_url);

      onOpenChange(false);
      reset();
      navigate(meta.path, { state: { prefill } });

      const label = data.identified_as || meta.label;
      if (category === "misc" && (!data.category || data.category === "misc")) {
        toast.success(`Photo uploaded — review the details before saving.`);
      } else {
        toast.success(`Looks like a ${label}. Review and save to add it.`);
      }
    } catch (e) {
      setStatus("error");
      setErrorMsg(e?.message || "Something went wrong identifying that photo.");
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
            Snap a photo of a rod, reel, fly line box, fly/lure, or other gear — we'll identify it and
            prefill a new entry for you to review.
          </DialogDescription>
        </DialogHeader>

        {working ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {status === "uploading" ? "Uploading photo…" : "Identifying gear…"}
            </p>
          </div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            <Button type="button" onClick={() => cameraRef.current?.click()}>
              <Camera className="w-4 h-4 mr-2" />
              Take photo
            </Button>
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose photo
            </Button>
          </div>
        )}

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }}
        />
      </DialogContent>
    </Dialog>
  );
}
