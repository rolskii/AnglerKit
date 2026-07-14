import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Route, MapPin, Calendar, Clock, Navigation, Trash2, Footprints } from 'lucide-react';
import { formatDistance, isImperial } from '@/lib/sphericalArea';

const formatDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

export default function RouteInfoDialog({ open, onOpenChange, route, onSaveName, onLoad, onDelete }) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open && route) {
      setName(route.name || '');
    }
  }, [open, route]);

  if (!route) return null;

  const handleSave = () => {
    onSaveName(name.trim() || route.name);
    onOpenChange(false);
  };

  const handleLoad = () => {
    onLoad(route);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(route.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm top-4 translate-y-0 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%] z-[5000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Route Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Route Name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Enter route name..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted">
              <Navigation className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-sm font-semibold">{formatDistance(route.distance_km || 0, isImperial())}</span>
              <span className="text-xs text-muted-foreground">distance</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted">
              <Clock className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-sm font-semibold">{formatDuration(route.duration_sec || 0)}</span>
              <span className="text-xs text-muted-foreground">duration</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted">
              <MapPin className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-sm font-semibold">{route.pins?.length || 0}</span>
              <span className="text-xs text-muted-foreground">pins</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-muted">
              <Footprints className="w-4 h-4 text-muted-foreground mb-1" />
              <span className="text-sm font-semibold">{route.track?.length || 0}</span>
              <span className="text-xs text-muted-foreground">points</span>
            </div>
          </div>
          {route.date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(route.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete} className="mr-auto">
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="secondary" onClick={handleLoad}>Load</Button>
          <Button onClick={handleSave}>Save Name</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}