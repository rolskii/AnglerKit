import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

export default function PinDialog({ open, onOpenChange, initialLabel, isEditing, onSave, onDelete }) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (open) setLabel(initialLabel || '');
  }, [open, initialLabel]);

  const handleSave = () => {
    onSave(label.trim() || 'Untitled Pin');
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm top-4 translate-y-0 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit pin' : 'Label this point'}</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Hotspot, Cedar Point, Camp..."
          className="mt-2"
        />
        <DialogFooter>
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Pin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}