import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReelCard from "@/components/reels/ReelCard";

export default function ReelDetailDialog({ open, onOpenChange, reel, lineCount, onEdit, onDelete }) {
  if (!reel) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reel Details</DialogTitle>
        </DialogHeader>
        <ReelCard reel={reel} lineCount={lineCount} onEdit={onEdit} onDelete={onDelete} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}