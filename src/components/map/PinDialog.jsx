import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, MapPin, Fish } from 'lucide-react';

export default function PinDialog({ open, onOpenChange, initialLabel, initialMarker, isEditing, onSave, onDelete }) {
  const [label, setLabel] = useState('');
  const [marker, setMarker] = useState('pin');

  useEffect(() => {
    if (open) {
      setLabel(initialLabel || '');
      setMarker(initialMarker || 'pin');
    }
  }, [open, initialLabel, initialMarker]);

  const handleSave = () => {
    onSave(label.trim() || (marker === 'fish' ? 'Fishing Spot' : 'Untitled Pin'), marker);
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
          <DialogTitle>{isEditing ? 'Edit marker' : 'Label this point'}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setMarker('pin')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-colors ${
              marker === 'pin' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-border text-muted-foreground'
            }`}
          >
            <MapPin className="w-6 h-6" />
            <span className="text-xs font-medium">Pin</span>
          </button>
          <button
            onClick={() => setMarker('fish')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-colors ${
              marker === 'fish' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-border text-muted-foreground'
            }`}
          >
            <Fish className="w-6 h-6" />
            <span className="text-xs font-medium">Fish Spot</span>
          </button>
        </div>
        <Input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={marker === 'fish' ? 'e.g. Lunker Cove, Bass Hole...' : 'e.g. Hotspot, Cedar Point, Camp...'}
        />
        <DialogFooter>
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete} className="mr-auto">
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}