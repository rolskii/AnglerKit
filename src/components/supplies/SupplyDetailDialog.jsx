import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SupplyCard from "@/components/supplies/SupplyCard";

export default function SupplyDetailDialog({ open, onOpenChange, item, onEdit, onDelete }) {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supply Details</DialogTitle>
        </DialogHeader>
        <SupplyCard item={item} onEdit={onEdit} onDelete={onDelete} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}