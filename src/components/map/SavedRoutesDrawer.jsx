import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MapPin, Route, Trash2, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FishIcon from '@/components/FishIcon';

export default function SavedRoutesDrawer({ open, onOpenChange, routes, onLoad, onDeleted }) {
  const handleDelete = async (id) => {
    try {
      await base44.entities.MapCourse.delete(id);
      onDeleted(id);
    } catch (e) {
      console.error('Failed to delete:', e);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Saved Routes & Pins</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1 mt-2 space-y-2">
          {routes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No saved routes or pins yet. Drop pins on the map and save them!</p>
          ) : (
            routes.map((r) => {
                const isPinsOnly = (!r.track || r.track.length === 0) && (r.pins?.length || 0) > 0;
                return (
              <div key={r.id} className="rounded-xl border border-border hover:bg-accent/10 transition-colors overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => onLoad(r)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPinsOnly ? (r.pins?.every(p => p.marker === 'fish') ? 'bg-emerald-500/10' : 'bg-amber-500/10') : 'bg-primary/10'}`}>
                      {isPinsOnly
                        ? (r.pins?.every(p => p.marker === 'fish')
                          ? <FishIcon className="w-5 h-5 text-emerald-500" />
                          : <MapPin className="w-5 h-5 text-amber-500" />)
                        : <Route className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {r.date && (
                          <span className="flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {r.distance_km != null && r.distance_km > 0 && <span>{r.distance_km.toFixed(2)} km</span>}
                        {(r.pins?.length || 0) > 0 && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {r.pins?.length || 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {isPinsOnly && r.pins?.length > 1 && (
                  <div className="border-t border-border divide-y divide-border">
                    {r.pins.map((pin, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => onLoad(r)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent/5 transition-colors"
                      >
                        {pin.marker === 'fish'
                          ? <FishIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                          : <MapPin className="w-4 h-4 text-amber-500 shrink-0" />}
                        <span className="text-xs text-muted-foreground truncate">{pin.label || 'Unnamed'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
                );
              })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}