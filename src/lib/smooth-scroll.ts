import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

/** Smooth-scroll to an element id (falls back to native scrolling when smooth scroll is off). */
export function scrollToId(id: string, offset = -96) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset, duration: 1.2 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}
