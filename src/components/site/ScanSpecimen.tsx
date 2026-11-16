/**
 * Looping demo: a scan line sweeps over a sample customer review and flags
 * each complaint as it passes. Pure CSS, shown fully flagged for reduced motion.
 */
function Corner({ className }: { className: string }) {
  return <span aria-hidden className={`absolute h-3.5 w-3.5 border-accent ${className}`} />;
}

export function ScanSpecimen() {
  return (
    <figure
      aria-label="Example: a customer review being scanned for complaints"
      className="relative rounded-sm border border-border bg-surface/80 p-5 shadow-[0_0_80px_-20px_var(--glow)] backdrop-blur sm:p-7"
    >
      <Corner className="-left-px -top-px border-l-2 border-t-2" />
      <Corner className="-right-px -top-px border-r-2 border-t-2" />
      <Corner className="-bottom-px -left-px border-b-2 border-l-2" />
      <Corner className="-bottom-px -right-px border-b-2 border-r-2" />

      <figcaption className="flex items-center justify-between text-xs text-muted">
        <span>Sample review: cordless vacuum</span>
        <span className="flex items-center gap-1.5 text-accent-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Scanning
        </span>
      </figcaption>

      <div className="scan-box relative mt-4 overflow-hidden">
        <span aria-hidden className="scan-line" />
        <p className="py-2 text-[17px] leading-[1.75] sm:text-lg">
          Honestly the suction is great and I wanted to love it. But the{" "}
          <span className="flag" style={{ "--d": "1.1s" } as React.CSSProperties}>
            battery lasts maybe ten minutes
          </span>
          , so I&apos;m only halfway through the house when it dies. The{" "}
          <span className="flag" style={{ "--d": "2.3s" } as React.CSSProperties}>
            bin is tiny
          </span>{" "}
          too, I empty it three times a clean, and the{" "}
          <span className="flag" style={{ "--d": "3.2s" } as React.CSSProperties}>
            filter clogged within a month
          </span>
          .
        </p>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs text-muted">Complaints found</p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm font-medium">
          {[
            ["Battery dies mid-clean", "1.4s"],
            ["Bin fills too fast", "2.6s"],
            ["Filter clogs", "3.5s"],
          ].map(([label, d]) => (
            <li
              key={label}
              className="scan-result rounded-full border border-cavity/50 bg-cavity-muted px-3 py-1.5 text-cavity"
              style={{ "--d": d } as React.CSSProperties}
            >
              {label}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
