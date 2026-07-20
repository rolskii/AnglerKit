import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LineCard from "@/components/lines/LineCard";

export default function LineDetailDialog({ open, onOpenChange, line, onEdit, onDelete }) {
  if (!line) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Line Details</DialogTitle>
        </DialogHeader>
        <LineCard line={line} onEdit={onEdit} onDelete={onDelete} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}