"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Holds the CSS entrance animations inside it until the block scrolls into view (on phones
 * the demo preview sits below the fold). Without JavaScript nothing is paused, so the
 * content is never left hidden.
 */
export function PlayWhenVisible({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaused(!entry.isIntersecting);
        if (entry.isIntersecting) observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-motion-paused={paused || undefined}>
      {children}
    </div>
  );
}
