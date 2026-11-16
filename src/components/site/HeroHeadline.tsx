"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from "@/lib/gsap";

/** Headline whose lines rise out of a mask on load. */
export function HeroHeadline({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-line]", {
        yPercent: 115,
        duration: 1.25,
        ease: "power4.out",
        stagger: 0.14,
        delay: 0.1,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <h1 ref={ref} className="display text-[clamp(3.4rem,11.5vw,10.5rem)]">
      {lines.map((line) => (
        // Padding keeps descenders (y, p) from being clipped by the mask.
        <span key={line} className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
          <span data-line className="block will-change-transform">
            {line}
          </span>
        </span>
      ))}
    </h1>
  );
}
