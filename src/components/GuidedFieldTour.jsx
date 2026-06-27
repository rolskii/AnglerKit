import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function GuidedFieldTour({ steps, active, onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const rafRef = useRef(null);

  // Reset when the tour starts
  useEffect(() => {
    if (active) {
      setStep(0);
      setReady(false);
      setRect(null);
    }
  }, [active]);

  // Scroll the field into view (instant) then measure in the next frame
  const scrollAndMeasure = (idx) => {
    const el = steps[idx]?.ref?.current;
    if (!el) return;
    el.scrollIntoView({ block: "nearest" }); // instant — no animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setRect(el.getBoundingClientRect());
    });
  };

  // Measure only (no scroll) — used by the scroll/resize listener
  const measureOnly = () => {
    const el = steps[step]?.ref?.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setRect(el.getBoundingClientRect());
    });
  };

  // Initial delay so the dialog open animation settles before measuring
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      setReady(true);
    }, 350);
    return () => clearTimeout(t);
  }, [active]);

  // Scroll + measure whenever the step changes (after we're ready)
  useLayoutEffect(() => {
    if (ready) scrollAndMeasure(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, step]);

  // Keep the spotlight aligned if the dialog scrolls or the viewport resizes
  useEffect(() => {
    if (!active) return;
    window.addEventListener("scroll", measureOnly, true);
    window.addEventListener("resize", measureOnly);
    return () => {
      window.removeEventListener("scroll", measureOnly, true);
      window.removeEventListener("resize", measureOnly);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, ready]);

  // Advance to a given step
  const goTo = (newStep) => {
    const clamped = Math.max(0, Math.min(newStep, steps.length - 1));
    setStep(clamped);
    // scrollAndMeasure will fire via the useLayoutEffect on step change,
    // but call it directly too for immediacy
    scrollAndMeasure(clamped);
  };

  if (!active || !ready) return null;
  const current = steps[step];
  if (!current) return null;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <>
      {/* Spotlight overlay — portaled, no buttons, pointer-events-none */}
      {rect && createPortal(
        <div className="fixed inset-0 z-[55] pointer-events-none">
          <div
            className="absolute rounded-md ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all duration-150"
            style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
          />
        </div>,
        document.body
      )}
      {/* Tour note — portaled next to the highlighted field */}
      {rect && createPortal(
        (() => {
          const noteWidth = 280;
          const noteHeight = 150;
          const gap = 12;
          const placeBelow = rect.bottom + noteHeight + gap < window.innerHeight;
          const top = placeBelow ? rect.bottom + gap : Math.max(8, rect.top - noteHeight - gap);
          let left = rect.left + rect.width / 2 - noteWidth / 2;
          left = Math.max(8, Math.min(left, window.innerWidth - noteWidth - 8));
          return (
            <div
              className="fixed z-[56] rounded-lg border-2 border-primary bg-primary text-primary-foreground shadow-xl p-3"
              style={{ top, left, width: noteWidth }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{current.title}</p>
                  <p className="text-xs text-primary-foreground/90 mt-0.5">{current.description}</p>
                </div>
                <button type="button" onClick={onClose} className="text-primary-foreground/80 hover:text-primary-foreground shrink-0 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-primary-foreground/80">{step + 1} / {steps.length}</span>
                <div className="flex gap-1.5">
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={() => goTo(step - 1)}
                      className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  {isLast ? (
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-colors"
                    >
                      Done
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goTo(step + 1)}
                      className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-primary-foreground text-primary hover:bg-primary-foreground/90 transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </>
  );
}