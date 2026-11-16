"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from "@/lib/gsap";

interface RevealProps {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: ElementType;
  y?: number;
  delay?: number;
  /** Animate direct children one after another instead of the wrapper. */
  stagger?: boolean;
}

/** Fades and lifts content in as it scrolls into view (GSAP ScrollTrigger). */
export function Reveal({ children, className, id, as = "div", y = 36, delay = 0, stagger = false }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const Component = as as ElementType;

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(stagger ? Array.from(el.children) : el, {
        y,
        opacity: 0,
        duration: 0.95,
        delay,
        ease: "power3.out",
        stagger: stagger ? 0.09 : 0,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [y, delay, stagger]);

  return (
    <Component ref={ref} id={id} className={className}>
      {children}
    </Component>
  );
}
