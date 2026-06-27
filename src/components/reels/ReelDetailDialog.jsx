import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReelCard from "@/components/reels/ReelCard";

export default function ReelDetailDialog({ open, onOpenChange, reel, lineCount, spooledLines, onEdit, onDelete }) {
  if (!reel) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reel Details</DialogTitle>
        </DialogHeader>
        <ReelCard reel={reel} lineCount={lineCount} spooledLines={spooledLines} onEdit={onEdit} onDelete={onDelete} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}