import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import CatchCard from "@/components/catches/CatchCard";

export default function CatchDetailDialog({ open, onOpenChange, catchItem, onEdit, onDelete, lines = [], rods = [] }) {
  if (!catchItem) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catch Details</DialogTitle>
        </DialogHeader>
        <CatchCard catchItem={catchItem} lines={lines} rods={rods} onEdit={onEdit} onDelete={onDelete} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}