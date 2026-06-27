import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function GuidedFieldTour({ steps, active, onClose }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  const measure = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = steps[step]?.ref?.current;
      if (el) setRect(el.getBoundingClientRect());
    });
  };

  useEffect(() => {
    if (!active) return;
    const el = steps[step]?.ref?.current;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    // Re-measure after the dialog open/scroll animation settles
    const t1 = setTimeout(measure, 250);
    const t2 = setTimeout(measure, 500);
    const onScroll = () => measure();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [active, step, steps]);

  if (!active || !rect) return null;
  const current = steps[step];
  if (!current) return null;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  const popoverTop = rect.bottom + 8 + 150 > window.innerHeight
    ? Math.max(12, rect.top - 160)
    : rect.bottom + 8;
  const popoverLeft = Math.max(12, Math.min(rect.left, window.innerWidth - 300));

  return (
    <>
      <div className="fixed inset-0 z-[55] pointer-events-none">
        <div
          className="absolute rounded-md ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] transition-all duration-200"
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
        />
      </div>
      <div
        className="fixed z-[60] w-72 rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-3"
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
    </>
  );
}