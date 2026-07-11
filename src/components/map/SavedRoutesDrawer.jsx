import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MapPin, Route, Trash2, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SavedRoutesDrawer({ open, onOpenChange, routes, onLoad, onDeleted }) {
  const handleDelete = async (id) => {
    await base44.entities.MapCourse.delete(id);
    onDeleted(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] flex flex-col z-[5000] [&~*]:z-[5000]" style={{ zIndex: 5000 }}>
        <SheetHeader>
          <SheetTitle>Saved Routes</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1 mt-2 space-y-2">
          {routes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No saved routes yet. Record a route and save it!</p>
          ) : (
            routes.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/10 transition-colors">
                <button
                  onClick={() => onLoad(r)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Route className="w-5 h-5 text-primary" />
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
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {r.pins?.length || 0}
                      </span>
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
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}