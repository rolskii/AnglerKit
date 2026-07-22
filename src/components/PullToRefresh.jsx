import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 50;
const MAX_PULL = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(null);
  const pullingRef = useRef(false);
  const activePointerRef = useRef(null);

  const isAtTop = useCallback(() => {
    const el = document.scrollingElement || document.documentElement;
    return (el?.scrollTop || window.scrollY) <= 0;
  }, []);

  const handlePointerDown = (e) => {
    if (refreshing) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!isAtTop()) return;
    startYRef.current = e.clientY;
    pullingRef.current = false;
    activePointerRef.current = e.pointerId;
  };

  const handlePointerMove = (e) => {
    if (startYRef.current === null || refreshing) return;
    if (activePointerRef.current !== e.pointerId) return;
    const delta = e.clientY - startYRef.current;
    if (delta > 0) {
      if (isAtTop()) {
        pullingRef.current = true;
        const dist = Math.min(delta * 0.4, MAX_PULL);
        setPullDistance(dist);
      } else {
        // scrolled away from top mid-pull — reset
        startYRef.current = null;
        setPullDistance(0);
      }
    }
  };

  const finishPull = async (e) => {
    if (startYRef.current === null) return;
    startYRef.current = null;
    activePointerRef.current = null;
    const shouldRefresh = pullingRef.current && pullDistance > THRESHOLD;
    pullingRef.current = false;
    if (shouldRefresh && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD - 10);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPull}
      onPointerCancel={finishPull}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className="flex items-start justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance }}
      >
        <RefreshCw className={`w-6 h-6 text-primary mt-3 ${refreshing ? "animate-spin" : ""}`} />
      </div>
      {children}
    </div>
  );
}