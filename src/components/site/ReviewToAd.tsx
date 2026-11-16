"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const ROWS = [
  {
    label: "What a customer wrote",
    text: "“I get maybe ten minutes before it quits and I'm only halfway through the house.”",
    tone: "text-muted",
  },
  { label: "The complaint", text: "Battery dies before the job is done.", tone: "text-cavity" },
  {
    label: "The gap",
    text: "A swappable battery, so a full clean never has to stop and wait for a charge.",
    tone: "text-accent-ink",
  },
  { label: "The ad", text: "“Finish the whole house. Not half of it.”", tone: "text-foreground" },
];

/** The four-step path from raw review to ad, with a line that draws as you scroll. */
export function ReviewToAd() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.6"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <ol ref={ref} className="relative">
      <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-border sm:left-[9px]" />
      <motion.span
        aria-hidden
        style={{ scaleY, transformOrigin: "top" }}
        className="draw-line absolute bottom-2 left-[7px] top-2 w-px bg-accent sm:left-[9px]"
      />
      {ROWS.map((row) => (
        <li key={row.label} className="relative grid gap-3 pb-14 pl-10 last:pb-0 sm:pl-14 md:grid-cols-[220px_1fr] md:gap-10">
          <span
            aria-hidden
            className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-accent bg-background sm:h-[19px] sm:w-[19px]"
          />
          <p className="pt-1 text-sm text-muted">{row.label}</p>
          <p className={`display text-[clamp(1.7rem,3.6vw,3.2rem)] leading-[1.08] ${row.tone}`}>{row.text}</p>
        </li>
      ))}
    </ol>
  );
}
