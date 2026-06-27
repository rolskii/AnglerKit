import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ImageUpload({ value = [], onChange }) {
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const images = Array.isArray(value) ? value : value ? [value] : [];

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) => base44.integrations.Core.UploadFile({ file }).then((r) => r.file_url))
      );
      onChange([...images, ...uploaded.filter(Boolean)]);
    } catch (e) {
      toast.error("Failed to upload image(s)");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

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
                disabled={uploading}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Upload photo
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => cameraRef.current?.click()} disabled={uploading}>
          <Camera className="w-4 h-4 mr-2" />
          Take photo
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}