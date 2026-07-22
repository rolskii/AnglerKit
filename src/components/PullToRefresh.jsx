import React, { useState, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(null);
  const currentPullRef = useRef(0);

  const onTouchStart = (e) => {
    if (window.scrollY === 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
    }
  };

  const onTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY === 0) {
      const dist = Math.min(delta * 0.4, 60);
      currentPullRef.current = dist;
      setPullDistance(dist);
    } else {
      startY.current = null;
      currentPullRef.current = 0;
      setPullDistance(0);
    }
  };

  const onTouchEnd = async () => {
    if (currentPullRef.current > 50 && !refreshing) {
      setRefreshing(true);
      setPullDistance(40);
      currentPullRef.current = 40;
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPullDistance(0);
        currentPullRef.current = 0;
      }
    } else {
      setPullDistance(0);
      currentPullRef.current = 0;
    }
    startY.current = null;
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance }}
      >
        <Loader2 className={`w-5 h-5 text-muted-foreground mt-2 animate-spin ${refreshing ? "" : "opacity-50"}`} />
      </div>
      {children}
    </div>
  );
}