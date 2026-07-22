import React, { useState, useRef } from "react";
import { RefreshCw } from "lucide-react";

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
        className="flex justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullDistance }}
      >
        <RefreshCw
          className={`w-6 h-6 text-primary mt-3 transition-opacity duration-150 ${refreshing ? "animate-spin opacity-100" : ""}`}
          style={{
            opacity: refreshing ? undefined : Math.min(pullDistance / 50, 0.8),
            transform: refreshing ? undefined : `rotate(${pullDistance * 3.6}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}