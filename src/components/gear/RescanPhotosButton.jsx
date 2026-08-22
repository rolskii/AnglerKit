import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  GEAR_EXTRACTION_PROMPT, GEAR_EXTRACTION_SCHEMA, mapExtractionToPrefill,
} from "@/lib/gearScan";

// Lets a user re-run the gear AI scan against photos already attached to an
// existing item, so additional details read off the photos (brand, model,
// size, specs…) can be pulled in without retyping. Only fills fields the user
// has left blank — anything they've already entered is preserved.
export default function RescanPhotosButton({ images, category, onApply, disabled }) {
  const [scanning, setScanning] = useState(false);
  const urls = (images || []).filter(Boolean);

  const handleRescan = async () => {
    if (!urls.length) {
      toast.info("Add a photo first so we can rescan it.");
      return;
    }
    setScanning(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: GEAR_EXTRACTION_PROMPT,
        file_urls: urls,
        response_json_schema: GEAR_EXTRACTION_SCHEMA,
      });
      const data = result?.output ?? result?.data ?? result ?? {};
      const prefill = mapExtractionToPrefill(category, data, urls);
      if (onApply) onApply(prefill, data);
      toast.success("Filled in details read from your photos — review and save.");
    } catch (e) {
      toast.error("Rescan failed — try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleRescan}
      disabled={scanning || disabled || !urls.length}
      className="mb-2"
    >
      {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
      Rescan photos for details
    </Button>
  );
}