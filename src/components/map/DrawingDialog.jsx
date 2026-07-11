import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

export default function DrawingDialog({ open, onOpenChange, initialLabel, initialDescription, color, onSave, onDelete }) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) {
      setLabel(initialLabel || '');
      setDescription(initialDescription || '');
    }
  }, [open, initialLabel, initialDescription]);

  const handleSave = () => {
    onSave(label.trim() || 'Untitled Drawing', description.trim());
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
          <DialogTitle className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: color || '#ef4444' }} />
            Drawing Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Drawing title..."
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes or description..."
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete} className="mr-auto">
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}