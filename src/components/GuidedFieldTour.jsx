import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function GuidedFieldTour({ steps, active, onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const [popSize, setPopSize] = useState({ w: 288, h: 120 });
  const popRef = useRef(null);
  const rafRef = useRef(null);

  // Reset when the tour starts
  useEffect(() => {
    if (active) {
      setStep(0);
      setReady(false);
      setRect(null);
    }
  }, [active]);

  // Measure the current field's position synchronously
  const measure = () => {
    const el = steps[step]?.ref?.current;
    if (el) setRect(el.getBoundingClientRect());
    if (popRef.current) {
      const r = popRef.current.getBoundingClientRect();
      setPopSize({ w: r.width, h: r.height });
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
  }, [active, step]);

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
      rafRef.current = requestAnimationFrame(measure);
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

  // Advance to a given step and measure that field immediately
  const goTo = (newStep) => {
    const clamped = Math.max(0, Math.min(newStep, steps.length - 1));
    setStep(clamped);
    const el = steps[clamped]?.ref?.current;
    if (el) setRect(el.getBoundingClientRect());
  };

  if (!active || !ready || !rect) return null;
  const current = steps[step];
  if (!current) return null;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const gap = 10;
  let popoverTop = rect.top - popSize.h - gap;
  if (popoverTop < 12) popoverTop = rect.bottom + gap;
  let popoverLeft = rect.left + rect.width / 2 - popSize.w / 2;
  popoverLeft = Math.max(12, Math.min(popoverLeft, window.innerWidth - popSize.w - 12));
  popoverTop = Math.max(12, Math.min(popoverTop, window.innerHeight - popSize.h - 12));

  return createPortal(
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none">
        <div
          className="absolute rounded-md ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all duration-200"
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
        />
      </div>
      <div
        ref={popRef}
        onPointerDown={(e) => e.stopPropagation()}
        className="fixed z-[60] w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-3 transition-all duration-200"
        style={{ top: popoverTop, left: popoverLeft }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{current.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
          </div>
          <button type="button" onPointerDown={(e) => { e.stopPropagation(); onClose(); }} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{step + 1} / {steps.length}</span>
          <div className="flex gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); goTo(step - 1); }}
                className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {isLast ? (
              <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
                className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onPointerDown={(e) => { e.stopPropagation(); goTo(step + 1); }}
                className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}