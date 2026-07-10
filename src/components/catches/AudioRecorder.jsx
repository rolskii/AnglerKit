import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Loader2, Upload, MicOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AudioRecorder({ value, onChange }) {
  const fileRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const [micSupported, setMicSupported] = useState(true);

  useEffect(() => {
    if (!navigator.mediaRecorder) setMicSupported(false);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(true);
        try {
          const res = await base44.integrations.Core.UploadFile({ file });
          if (res?.file_url) onChange(res.file_url);
        } catch (e) {
          toast.error("Failed to save recording");
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      toast.error("Microphone access denied or unavailable");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleUpload = async (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file");
      return;
    }
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      if (res?.file_url) onChange(res.file_url);
    } catch (e) {
      toast.error("Failed to upload audio");
    } finally {
      setUploading(false);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative rounded-lg border border-border p-2 bg-muted/30">
          <audio src={value} controls className="w-full" />
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
        <div className="flex gap-2">
          {micSupported && (
            <Button
              type="button"
              variant={recording ? "destructive" : "outline"}
              size="sm"
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : recording ? (
                <Square className="w-4 h-4 mr-2" />
              ) : (
                <Mic className="w-4 h-4 mr-2" />
              )}
              {recording ? `Stop (${fmt(seconds)})` : "Record audio"}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading || recording}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload audio
          </Button>
          {!micSupported && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground self-center">
              <MicOff className="w-3.5 h-3.5" /> Recording not supported
            </p>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}