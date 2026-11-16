"use client";

import { useState } from "react";
import { Crosshair, RotateCw } from "lucide-react";
import { CopyButton } from "@/components/report/CopyButton";
import { Reveal } from "@/components/site/Reveal";
import type { AdAngle } from "@/lib/report-data";

const TONES = [
  { face: "bg-foreground text-background", sub: "text-background/70", hint: "text-background/60" },
  { face: "bg-accent text-on-accent", sub: "text-on-accent/80", hint: "text-on-accent/70" },
  { face: "bg-cavity text-background", sub: "text-background/80", hint: "text-background/70" },
  { face: "border border-border bg-surface text-foreground", sub: "text-muted", hint: "text-muted" },
];

function AngleCard({ angle, index }: { angle: AdAngle; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const tone = TONES[index % TONES.length];
  const long = angle.name.length > 42;

  const fields: [string, string][] = [
    ["Hidden frustration", angle.hiddenFrustration],
    ["The gap", angle.marketGap],
    ["Why it works", angle.whyItWorks],
  ];

  return (
    <li className="[perspective:1400px]">
      <div
        className={`relative h-[400px] transition-transform duration-700 ease-[cubic-bezier(0.3,0.8,0.2,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front: the poster */}
        <button
          type="button"
          onClick={() => setFlipped(true)}
          inert={flipped}
          aria-label={`${angle.name}. Flip to see the detail`}
          className={`absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl p-6 text-left [backface-visibility:hidden] sm:p-7 ${tone.face}`}
        >
          <Crosshair
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-10 h-56 w-56 opacity-[0.12]"
            strokeWidth={1.2}
          />
          <p className={`relative text-sm ${tone.sub}`}>Customers feel</p>
          <div className="relative">
            <p className={`mb-4 line-clamp-3 text-[15px] leading-snug ${tone.sub}`}>“{angle.customerPain}”</p>
            <h3 className={`display leading-[1.02] ${long ? "text-[1.9rem]" : "text-[2.4rem]"}`}>{angle.name}</h3>
          </div>
          <p className={`relative inline-flex items-center gap-2 text-sm ${tone.hint}`}>
            <RotateCw className="h-4 w-4" aria-hidden /> Flip for the detail
          </p>
        </button>

        {/* Back: the thinking behind it */}
        <div
          inert={!flipped}
          className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl border border-border bg-surface p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-7"
        >
          <h3 className="display text-2xl leading-tight">{angle.name}</h3>
          <dl data-lenis-prevent className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 text-sm leading-relaxed">
            {fields.map(([label, text]) => (
              <div key={label} className="border-t border-border pt-2.5">
                <dt className="font-semibold">{label}</dt>
                <dd className="mt-0.5 text-muted">{text}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center justify-between gap-3">
            <CopyButton
              label="Copy angle"
              getText={() =>
                `${angle.name}\nPain: ${angle.customerPain}\n${fields.map(([l, t]) => `${l}: ${t}`).join("\n")}`
              }
            />
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-accent-ink hover:underline"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden /> Flip back
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

/** Ad angles as colourful poster cards. Each one flips to show the reasoning behind it. */
export function AngleCards({ angles }: { angles: AdAngle[] }) {
  if (angles.length === 0) return null;
  return (
    <Reveal as="ul" stagger y={40} className="grid gap-5 sm:grid-cols-2">
      {angles.map((angle, i) => (
        <AngleCard key={`${angle.name}-${i}`} angle={angle} index={i} />
      ))}
    </Reveal>
  );
}
