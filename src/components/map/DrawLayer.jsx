import React, { useRef, useCallback } from 'react';

export default function DrawLayer({ active, mapRef, onStroke }) {
  const drawingRef = useRef(false);
  const strokeRef = useRef([]);

  const handlePointerDown = useCallback((e) => {
    if (!active || !mapRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokeRef.current = [];
    const coord = mapRef.current.convertPointOnPageToCoordinate(
      new DOMPoint(e.pageX, e.pageY)
    );
    if (coord) strokeRef.current.push({ lat: coord.latitude, lon: coord.longitude });
  }, [active, mapRef]);

  const handlePointerMove = useCallback((e) => {
    if (!drawingRef.current || !mapRef.current) return;
    e.preventDefault();
    const coord = mapRef.current.convertPointOnPageToCoordinate(
      new DOMPoint(e.pageX, e.pageY)
    );
    if (coord) {
      const c = { lat: coord.latitude, lon: coord.longitude };
      const last = strokeRef.current[strokeRef.current.length - 1];
      if (last) {
        const dlat = c.lat - last.lat;
        const dlon = c.lon - last.lon;
        if (Math.sqrt(dlat * dlat + dlon * dlon) < 0.00001) return; // ~1m throttle
      }
      strokeRef.current.push(c);
      onStroke([...strokeRef.current], false);
    }
  }, [mapRef, onStroke]);

  const handlePointerUp = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (strokeRef.current.length > 1) {
      onStroke([...strokeRef.current], true);
    } else {
      onStroke([], true);
    }
    strokeRef.current = [];
  }, [onStroke]);

  if (!active) return null;

  return (
    <div
      className="absolute inset-0 z-[470] cursor-crosshair"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}