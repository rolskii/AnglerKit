import React from 'react';
import { Play, Pause, Square, MapPin, Save, Crosshair, Layers, FolderOpen, Circle, Route, Pencil, Ruler } from 'lucide-react';

const ctrlBase = "flex items-center justify-center rounded-full shadow-lg backdrop-blur-xl transition-all active:scale-90";
const ctrlSize = "w-12 h-12";

export default function MapControls({
  isTracking,
  isPaused,
  hasTrack,
  hasPins,
  pinMode,
  onStart,
  onPause,
  onStop,
  onAddPin,
  onSave,
  onCenter,
  onToggleLayer,
  onOpenRoutes,
  showAllRoutes,
  onToggleAllRoutes,
  drawMode,
  measureMode,
  onToggleDraw,
  onToggleMeasure,
}) {
  return (
    <>
      {/* Top-right: layers + saved routes */}
      <div className="absolute top-16 right-3 z-[500] flex flex-col gap-2">
        <button
          onClick={onToggleLayer}
          className={`${ctrlBase} ${ctrlSize} bg-background/90 text-foreground border border-border`}
          title="Toggle map layers"
        >
          <Layers className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenRoutes}
          className={`${ctrlBase} ${ctrlSize} bg-background/90 text-foreground border border-border`}
          title="Saved routes"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleAllRoutes}
          className={`${ctrlBase} ${ctrlSize} border ${
            showAllRoutes
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background/90 text-foreground border-border'
          }`}
          title="Show all routes on map"
        >
          <Route className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleDraw}
          className={`${ctrlBase} ${ctrlSize} border ${
            drawMode
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-background/90 text-foreground border-border'
          }`}
          title="Draw on map"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={onToggleMeasure}
          className={`${ctrlBase} ${ctrlSize} border ${
            measureMode
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-background/90 text-foreground border-border'
          }`}
          title="Measure distance"
        >
          <Ruler className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom-center: tracking + pin controls */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2">
        {/* Center on GPS */}
        <button
          onClick={onCenter}
          className={`${ctrlBase} ${ctrlSize} bg-background/90 text-primary border border-border`}
          title="Center on my location"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Start / Pause / Stop */}
        {!isTracking && !isPaused && (
          <button
            onClick={onStart}
            className={`${ctrlBase} w-16 h-16 bg-red-600 text-white`}
            title="Start recording"
          >
            <Circle className="w-7 h-7" fill="currentColor" />
          </button>
        )}

        {(isTracking || isPaused) && (
          <>
            {isTracking && !isPaused && (
              <button
                onClick={onPause}
                className={`${ctrlBase} ${ctrlSize} bg-amber-500 text-white`}
                title="Pause"
              >
                <Pause className="w-5 h-5" fill="currentColor" />
              </button>
            )}
            {isPaused && (
              <button
                onClick={onStart}
                className={`${ctrlBase} ${ctrlSize} bg-primary text-primary-foreground`}
                title="Resume"
              >
                <Play className="w-5 h-5" fill="currentColor" />
              </button>
            )}
            <button
              onClick={onStop}
              className={`${ctrlBase} ${ctrlSize} bg-destructive text-destructive-foreground`}
              title="Stop & finish"
            >
              <Square className="w-5 h-5" fill="currentColor" />
            </button>
          </>
        )}

        {/* Add pin */}
        <button
          onClick={onAddPin}
          className={`${ctrlBase} ${ctrlSize} border ${
            pinMode
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-background/90 text-primary border-border'
          }`}
          title="Add a point of interest"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* Save */}
        {(hasTrack || hasPins) && !isTracking && !isPaused && (
          <button
            onClick={onSave}
            className={`${ctrlBase} ${ctrlSize} bg-primary text-primary-foreground`}
            title="Save route"
          >
            <Save className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  );
}