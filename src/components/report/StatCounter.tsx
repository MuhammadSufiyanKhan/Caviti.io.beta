"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from "@/lib/gsap";

/** A big number that counts up when it scrolls into view. */
export function StatCounter({ value, label }: { value: string | number; label: string }) {
  const numberRef = useRef<HTMLElement>(null);
  const target = typeof value === "number" ? value : parseFloat(value);
  const decimals = typeof value === "string" && value.includes(".") ? value.split(".")[1].length : 0;

  useIsoLayoutEffect(() => {
    const el = numberRef.current;
    if (!el || Number.isNaN(target) || prefersReducedMotion()) return;
    el.textContent = (0).toFixed(decimals);
    const counter = { v: 0 };
    const tween = gsap.to(counter, {
      v: target,
      duration: 1.4,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 95%", once: true },
      onUpdate: () => {
        el.textContent = counter.v.toFixed(decimals);
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      el.textContent = String(value);
    };
  }, [target, decimals, value]);

  return (
    <div>
      <dd ref={numberRef} className="display text-5xl tabular-nums sm:text-6xl">
        {value}
      </dd>
      <dt className="mt-1 text-sm text-muted">{label}</dt>
    </div>
  );
}
