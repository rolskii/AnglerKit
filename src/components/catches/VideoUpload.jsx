import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2, Video } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function VideoUpload({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file");
      return;
    }
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) onChange(res.file_url);
    } catch (e) {
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <video src={value} controls className="w-full max-h-64 bg-black" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-7 w-7 absolute top-1 right-1"
            onClick={() => onChange("")}
            disabled={uploading}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      {!value && (
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
          Upload video
        </Button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}