import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, MapPin, Save, Crosshair, Layers, FolderOpen, Circle, Route, Pencil, Ruler, Hexagon, ScrollText, Share2 } from 'lucide-react';
import FishIcon from '@/components/FishIcon';

const ctrlBase = "relative flex items-center justify-center rounded-full shadow-lg backdrop-blur-xl transition-all active:scale-90";
const ctrlSize = "w-12 h-12";

// Onboarding label shown beside a control — rendered only while hints are
// active (first 7 seconds on the map page), then it disappears.
function Hint({ show, text, className }) {
  if (!show) return null;
  return (
    <span
      className={`absolute whitespace-nowrap pointer-events-none z-[600] rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 shadow-lg ${className}`}
    >
      {text}
    </span>
  );
}

export default function MapControls({
  isTracking,
  isPaused,
  hasTrack,
  hasPins,
  hasDrawings,
  hasAreas,
  hasMeasurements,
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
  areaMode,
  onToggleDraw,
  onToggleMeasure,
  onToggleArea,
  onOpenGeoHub,
  geoHubActive,
  onOpenRegs,
  onShareMap,
}) {
  // Temporary icon labels for new users — shown for the first 7 seconds
  const [showHints, setShowHints] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowHints(false), 7000);
    return () => clearTimeout(t);
  }, []);

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
          <Hint show={showHints} text="Map type" className="right-full mr-2 top-1/2 -translate-y-1/2" />
        </button>
        <button
          onClick={onOpenGeoHub}
          className={`${ctrlBase} ${ctrlSize} border ${
            geoHubActive
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-background/90 text-foreground border-border'
          }`}
          title="Fishing Data Layers"
        >
          <FishIcon className="w-5 h-5" flip={false} />
          <Hint show={showHints} text="Fishing layers" className="right-full mr-2 top-1/2 -translate-y-1/2" />
        </button>
        <button
          onClick={() => onOpenRegs()}
          className={`${ctrlBase} ${ctrlSize} bg-background/90 text-foreground border border-border`}
          title="Fishing regulations for this area"
        >
          <ScrollText className="w-5 h-5" />
          <Hint show={showHints} text="Regulations" className="right-full mr-2 top-1/2 -translate-y-1/2" />
        </button>
        <button
          onClick={onOpenRoutes}
          className={`${ctrlBase} ${ctrlSize} bg-background/90 text-foreground border border-border`}
          title="Saved routes"
        >
          <FolderOpen className="w-5 h-5" />
          <Hint show={showHints} text="Saved routes" className="right-full mr-2 top-1/2 -translate-y-1/2" />
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
          <Hint show={showHints} text="All routes" className="right-full mr-2 top-1/2 -translate-y-1/2" />
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
          <Hint show={showHints} text="Draw" className="right-full mr-2 top-1/2 -translate-y-1/2" />
        </button>
        <button
          onClick={onToggleMeasure}
          className={`${ctrlBase} ${ctrlSize} border ${
            measureMode
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background/90 text-foreground border-border'
          }`}
          title="Measure distance"
        >
          <Ruler className="w-5 h-5" />
          <Hint show={showHints} text="Measure" className="right-full mr-2 top-1/2 -translate-y-1/2" />
        </button>
        <button
          onClick={onToggleArea}
          className={`${ctrlBase} ${ctrlSize} border ${
            areaMode
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-background/90 text-foreground border-border'
          }`}
          title="Measure area"
        >
          <Hexagon className="w-5 h-5" />
          <Hint show={showHints} text="Area" className="right-full mr-2 top-1/2 -translate-y-1/2" />
        </button>
        <button
          onClick={onShareMap}
          className={`${ctrlBase} ${ctrlSize} bg-background/90 text-foreground border border-border`}
          title="Share this map view"
        >
          <Share2 className="w-5 h-5" />
          <Hint show={showHints} text="Share" className="right-full mr-2 top-1/2 -translate-y-1/2" />
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
          <Hint show={showHints} text="My location" className="bottom-full mb-2 left-1/2 -translate-x-1/2" />
        </button>

        {/* Start / Pause / Stop */}
        {!isTracking && !isPaused && (
          <button
            onClick={onStart}
            className={`${ctrlBase} w-16 h-16 bg-red-600 text-white`}
            title="Start recording"
          >
            <Circle className="w-7 h-7" fill="currentColor" />
            <Hint show={showHints} text="Record" className="bottom-full mb-2 left-1/2 -translate-x-1/2" />
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
                <Hint show={showHints} text="Pause" className="bottom-full mb-2 left-1/2 -translate-x-1/2" />
              </button>
            )}
            {isPaused && (
              <button
                onClick={onStart}
                className={`${ctrlBase} ${ctrlSize} bg-primary text-primary-foreground`}
                title="Resume"
              >
                <Play className="w-5 h-5" fill="currentColor" />
                <Hint show={showHints} text="Resume" className="bottom-full mb-2 left-1/2 -translate-x-1/2" />
              </button>
            )}
            <button
              onClick={onStop}
              className={`${ctrlBase} ${ctrlSize} bg-destructive text-destructive-foreground`}
              title="Stop & finish"
            >
              <Square className="w-5 h-5" fill="currentColor" />
              <Hint show={showHints} text="Stop" className="bottom-full mb-2 left-1/2 -translate-x-1/2" />
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
          <Hint show={showHints} text="Add pin" className="bottom-full mb-2 left-1/2 -translate-x-1/2" />
        </button>

        {/* Save */}
        {(hasTrack || hasPins || hasDrawings || hasAreas || hasMeasurements) && !isTracking && !isPaused && (
          <button
            onClick={onSave}
            className={`${ctrlBase} ${ctrlSize} bg-primary text-primary-foreground`}
            title="Save route"
          >
            <Save className="w-5 h-5" />
            <Hint show={showHints} text="Save" className="bottom-full mb-2 left-1/2 -translate-x-1/2" />
          </button>
        )}
      </div>
    </>
  );
}