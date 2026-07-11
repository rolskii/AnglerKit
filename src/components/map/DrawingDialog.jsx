import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';

const COLORS = [
  '#ef4444', '#f59e0b', '#22c55e', '#3b82f6',
  '#8b5cf6', '#ffffff', '#000000',
];

export default function DrawingDialog({ open, onOpenChange, initialLabel, initialDescription, color, onSave, onDelete }) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(color || '#ef4444');

  useEffect(() => {
    if (open) {
      setLabel(initialLabel || '');
      setDescription(initialDescription || '');
      setSelectedColor(color || '#ef4444');
    }
  }, [open, initialLabel, initialDescription, color]);

  const handleSave = () => {
    onSave(label.trim() || 'Untitled Drawing', description.trim(), selectedColor);
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
            <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: selectedColor }} />
            Edit Drawing
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
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${selectedColor === c ? 'border-foreground scale-110' : 'border-border'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
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