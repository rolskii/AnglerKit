import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function GuidedFieldTour({ steps, active, onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const [popSize, setPopSize] = useState({ w: 288, h: 120 });
  const rafRef = useRef(null);
  const popRef = useRef(null);

  useEffect(() => {
    if (active) {
      setStep(0);
      setReady(false);
    }
  }, [active]);

  const measure = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = steps[step]?.ref?.current;
      if (el) setRect(el.getBoundingClientRect());
      if (popRef.current) {
        const r = popRef.current.getBoundingClientRect();
        setPopSize({ w: r.width, h: r.height });
      }
    });
  };

  useEffect(() => {
    if (!active) return;
    // Wait for the dialog open animation to finish before measuring
    const start = setTimeout(() => {
      setReady(true);
      const el = steps[step]?.ref?.current;
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
      measure();
    }, 350);
    const t1 = setTimeout(measure, 600);
    const t2 = setTimeout(measure, 900);
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(start);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [active, step, steps]);

  useLayoutEffect(() => {
    if (ready) measure();
  }, [ready, step]);

  if (!active || !ready || !rect) return null;
  const current = steps[step];
  if (!current) return null;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const gap = 10;
  // Position popover directly above the field, centered horizontally over it
  let popoverTop = rect.top - popSize.h - gap;
  if (popoverTop < 12) popoverTop = rect.bottom + gap; // not enough room above -> below
  let popoverLeft = rect.left + rect.width / 2 - popSize.w / 2;
  popoverLeft = Math.max(12, Math.min(popoverLeft, window.innerWidth - popSize.w - 12));

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
        className="fixed z-[60] w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-3 transition-all duration-200"
        style={{ top: popoverTop, left: popoverLeft }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{current.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{step + 1} / {steps.length}</span>
          <div className="flex gap-1.5">
            {!isFirst && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            {isLast ? (
              <Button type="button" size="sm" onClick={onClose}>Done</Button>
            ) : (
              <Button type="button" size="sm" onClick={() => setStep((s) => s + 1)}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}