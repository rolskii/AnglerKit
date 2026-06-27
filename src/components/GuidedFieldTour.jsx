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

  // Measure the current field's position and scroll it into view
  const measure = () => {
    const el = steps[step]?.ref?.current;
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setRect(el.getBoundingClientRect());
    }
  };

  // Initial delay so the dialog open animation settles before measuring
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      setReady(true);
      measure();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Re-measure immediately whenever the step changes (after we're ready)
  useLayoutEffect(() => {
    if (ready) measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, step]);

  // Keep the spotlight aligned if the dialog scrolls or the viewport resizes
  useEffect(() => {
    if (!active) return;
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = steps[step]?.ref?.current;
        if (el) setRect(el.getBoundingClientRect());
      });
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, ready]);

  // Advance to a given step, scroll it into view, and measure
  const goTo = (newStep) => {
    const clamped = Math.max(0, Math.min(newStep, steps.length - 1));
    setStep(clamped);
    const el = steps[clamped]?.ref?.current;
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setRect(el.getBoundingClientRect());
    }
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
            className="absolute rounded-md ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all duration-200"
            style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
          />
        </div>,
        document.body
      )}
      {/* Tour bar — inside the dialog so button clicks work reliably */}
      <div className="sticky bottom-0 z-10 mt-4 bg-popover border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{current.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{current.description}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">{step + 1} / {steps.length}</span>
          <div className="flex gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onClick={() => goTo(step - 1)}
                className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(step + 1)}
                className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}