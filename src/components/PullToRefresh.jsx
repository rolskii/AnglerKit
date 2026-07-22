import React, { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const containerRef = useRef(null);

  // All synchronous gesture state lives in refs — no stale closures
  const startYRef = useRef(null);
  const pullDistRef = useRef(0);
  const pullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  const isAtTop = useCallback(() => {
    const el = document.scrollingElement || document.documentElement;
    return (el?.scrollTop || window.scrollY) <= 0;
  }, []);

  // Elastic rubber-band: pull feels free with gentle diminishing returns
  const calcDist = (delta) => {
    return (delta * 0.5) / (1 + delta / 320);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (refreshingRef.current) return;
      if (!isAtTop()) return;
      startYRef.current = e.touches[0].clientY;
      pullingRef.current = false;
      pullDistRef.current = 0;
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0 && isAtTop()) {
        // Prevent the browser from scrolling / overscrolling so we own the gesture
        e.preventDefault();
        if (!pullingRef.current) {
          pullingRef.current = true;
          setPulling(true);
        }
        const dist = calcDist(delta);
        pullDistRef.current = dist;
        setPullDistance(dist);
      } else if (delta <= 0) {
        pullingRef.current = false;
        pullDistRef.current = 0;
        setPulling(false);
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (startYRef.current === null) return;
      startYRef.current = null;
      const shouldRefresh = pullingRef.current && pullDistRef.current > THRESHOLD;
      pullingRef.current = false;
      setPulling(false);
      if (shouldRefresh && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullDistance(48);
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullDistance(0);
          pullDistRef.current = 0;
        }
      } else {
        setPullDistance(0);
        pullDistRef.current = 0;
      }
    };

    // passive: false is critical — allows preventDefault() in touchmove
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isAtTop]);

  const pullProgress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div ref={containerRef}>
      <div
        className="flex items-start justify-center overflow-hidden"
        style={{
          height: pullDistance,
          transition: pulling
            ? "none"
            : "height 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <RefreshCw
          className={`text-primary/70 mt-4 ${refreshing ? "animate-spin" : ""} ${!pulling && !refreshing ? "transition-transform duration-150" : ""}`}
          style={{
            width: 18,
            height: 18,
            opacity: refreshing ? 1 : Math.min(pullProgress * 1.2, 1),
            transform: refreshing ? undefined : `scale(${0.7 + pullProgress * 0.3}) rotate(${pullProgress * 360}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}