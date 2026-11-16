"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

function Word({
  word,
  range,
  progress,
  mark,
  still,
}: {
  word: string;
  range: [number, number];
  progress: MotionValue<number>;
  mark: boolean;
  still: boolean;
}) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span style={{ opacity: still ? 1 : opacity }} className={`inline-block ${mark ? "text-cavity" : ""}`}>
      {word}
      &nbsp;
    </motion.span>
  );
}

/** Large statement whose words light up as the section scrolls into view. */
export function StatementReveal({ text, marks = [] }: { text: string; marks?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const still = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.5"] });
  const words = text.split(" ");

  return (
    <p ref={ref} className="display text-[clamp(2.2rem,6.2vw,5.6rem)] leading-[1.02]">
      {words.map((word, i) => (
        <Word
          key={i}
          word={word}
          range={[i / words.length, Math.min(1, (i + 1.5) / words.length)]}
          progress={scrollYProgress}
          mark={marks.includes(word.replace(/[^a-z]/gi, "").toLowerCase())}
          still={still}
        />
      ))}
    </p>
  );
}
