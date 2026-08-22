import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Trash2, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { extractExif } from "@/lib/exifUtils";
import { getPosition, reverseGeocode, fetchCurrentWeather, analyzeCatchPhoto } from "@/lib/catchCapture";

// Photo capture for the Fish Log. "Take photo" uses the device camera and, on
// success, fills in the time, current location (reverse geocoded), and a brief
// local-weather summary. "Upload photo" pulls the capture time and location
// from the photo's EXIF metadata when available. Either way, the photos are
// also run through the fish-identification scan to suggest the species.
// Captured details are handed to the form via onMeta, filling only blank fields.
export default function CatchPhotoUpload({ value = [], onChange, onMeta, isMetric = true, disabled }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const images = Array.isArray(value) ? value : value ? [value] : [];

  const handleFiles = async (fileList, source) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    let uploaded = [];
    try {
      uploaded = await Promise.all(
        files.map((f) => base44.integrations.Core.UploadFile({ file: f }).then((r) => r.file_url))
      );
      uploaded = uploaded.filter(Boolean);
      onChange([...images, ...uploaded]);
    } catch {
      toast.error("Failed to upload photo(s)");
      setUploading(false);
      return;
    }
    setUploading(false);

    setEnriching(true);
    try {
      const file = files[0];
      const fileUrl = uploaded[0];
      const meta = {};

      if (source === "camera") {
        const now = new Date();
        meta.date = now.toISOString().slice(0, 10);
        meta.time = now.toTimeString().slice(0, 5);
        const pos = await getPosition();
        if (pos) {
          const [loc, cond] = await Promise.all([
            reverseGeocode(pos.lat, pos.lon),
            fetchCurrentWeather(pos.lat, pos.lon, isMetric),
          ]);
          if (loc) meta.location = loc;
          if (cond) meta.conditions = cond;
        }
      } else {
        const exif = await extractExif(file);
        if (exif) {
          if (exif.date) meta.date = exif.date;
          if (exif.time) meta.time = exif.time;
          if (exif.lat != null && exif.lon != null) {
            const loc = await reverseGeocode(exif.lat, exif.lon);
            if (loc) meta.location = loc;
          }
        }
      }

      const { species, conditions } = await analyzeCatchPhoto([fileUrl]);
      if (species) meta.species = species;
      // For uploads there's no live weather, so infer basic conditions from the
      // photo's background. Camera shots already use the real local weather.
      if (source === "upload" && conditions) meta.conditions = conditions;

      if (onMeta && Object.keys(meta).length) onMeta(meta);
    } catch {
      // enrichment is best-effort — silently ignore failures
    } finally {
      setEnriching(false);
    }
  };

  const removeImage = (idx) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative rounded-lg border border-border overflow-hidden aspect-square">
              <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-7 w-7 absolute top-1 right-1"
                onClick={() => removeImage(idx)}
                disabled={uploading || enriching}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      {enriching && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Identifying catch &amp; capturing details…
        </p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()} disabled={uploading || enriching || disabled}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
          Take photo
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || enriching || disabled}>
          <Upload className="w-4 h-4 mr-2" />
          Upload photo
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Taking a photo fills in the time, spot, and local weather. Uploading pulls time &amp; location from the photo when available. Either way, we'll try to identify the species.
      </p>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files, "camera"); e.target.value = ""; }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files, "upload"); e.target.value = ""; }}
      />
    </div>
  );
}