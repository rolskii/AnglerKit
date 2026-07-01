import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY === 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      drag={atTop && !refreshing ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={async (e, info) => {
        if (info.offset.y > 80 && !refreshing) {
          setRefreshing(true);
          try { await onRefresh(); } finally { setRefreshing(false); }
        }
      }}
    >
      <motion.div
        className="flex justify-center overflow-hidden"
        animate={{ height: refreshing ? 40 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Loader2 className="w-5 h-5 text-muted-foreground mt-2 animate-spin" />
      </motion.div>
      {children}
    </motion.div>
  );
}