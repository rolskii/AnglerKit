import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RodCard from "@/components/rods/RodCard";

export default function RodDetailDialog({ open, onOpenChange, rod, lineCount, pairedLines, onEdit, onDelete }) {
  if (!rod) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rod Details</DialogTitle>
        </DialogHeader>
        <RodCard rod={rod} lineCount={lineCount} pairedLines={pairedLines} onEdit={onEdit} onDelete={onDelete} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}