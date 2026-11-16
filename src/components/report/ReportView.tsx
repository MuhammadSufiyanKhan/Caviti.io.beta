import type { ReactNode } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { parseSection } from "@/lib/report-metrics";
import type { GuestReport } from "@/lib/report-data";

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Findings({ items, tone }: { items: string[]; tone: "cavity" | "accent" }) {
  return (
    <ul className="border-b border-border">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4 border-t border-border py-4">
          <span
            aria-hidden
            className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${tone === "cavity" ? "bg-cavity" : "bg-accent"}`}
          />
          <p className="max-w-3xl leading-relaxed">
            <span className={tone === "cavity" ? "mark-cavity" : ""}>
              <Inline text={item} />
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted" role="status">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </p>
  );
}

interface ReportViewProps {
  report: GuestReport;
  themesLoading: boolean;
  adsLoading: boolean;
  /** Shown under the title: the save toggle, or saved status. */
  actions?: ReactNode;
  dateLabel?: string;
}

export function ReportView({ report, themesLoading, adsLoading, actions, dateLabel }: ReportViewProps) {
  const { product_name: name, market_data: data } = report;
  const negatives = parseSection(data.analysis, "NEGATIVE POINTS");
  const gaps = parseSection(data.analysis, "MARKET GAPS");
  const strategies = parseSection(data.analysis, "ENTRY STRATEGIES");
  const themes = (data.complaint_themes ?? []).filter((t) => t && (t.theme || (t.quotes ?? []).length > 0));
  const hasAds = !!(data.ad_angles?.length || data.hooks?.length || data.scripts?.length);

  const stats = [
    typeof data.reviews_count === "number" && data.reviews_count > 0
      ? { value: data.reviews_count, label: "reviews and snippets read" }
      : null,
    { value: negatives.length, label: "complaints found" },
    { value: gaps.length, label: "market gaps" },
    data.average_rating ? { value: data.average_rating, label: "average star rating" } : null,
  ].filter(Boolean) as { value: string | number; label: string }[];

  return (
    <article>
      <header>
        <h1 className="font-display text-4xl font-semibold capitalize leading-[1.05] tracking-tight sm:text-5xl">
          {name}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          {dateLabel && <span>{dateLabel}</span>}
          {data.url && (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent-ink hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="max-w-[260px] truncate">{data.url.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-5 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dd className="font-display text-3xl font-semibold tabular-nums">{s.value}</dd>
              <dt className="mt-0.5 text-sm text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>

        {actions && <div className="mt-6">{actions}</div>}
      </header>

      <Section
        title="What customers complain about"
        intro="The problems people keep running into, in their own words where we found them."
      >
        {themesLoading && <div className="mb-5"><Pending label="Grouping customer quotes by complaint…" /></div>}
        {themes.length > 0 && (
          <div className="mb-8 space-y-8">
            {themes.map((theme, i) => (
              <div key={i}>
                <h3 className="flex flex-wrap items-baseline gap-x-3 font-semibold">
                  <span>{theme.theme}</span>
                  {typeof theme.mentions === "number" && theme.mentions > 0 && (
                    <span className="text-sm font-normal text-cavity">
                      {theme.mentions} {theme.mentions === 1 ? "mention" : "mentions"}
                    </span>
                  )}
                </h3>
                {theme.description && <p className="mt-1 max-w-3xl text-sm text-muted">{theme.description}</p>}
                <div className="mt-3 space-y-2">
                  {(theme.quotes ?? []).map((quote, q) => (
                    <blockquote
                      key={q}
                      className="max-w-3xl whitespace-pre-wrap border-l-2 border-cavity pl-4 text-[15px] italic leading-relaxed"
                    >
                      “{quote}”
                    </blockquote>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {negatives.length > 0 ? (
          <Findings items={negatives} tone="cavity" />
        ) : (
          <p className="text-muted">No complaints were found for this product.</p>
        )}
      </Section>

      <Section title="Gaps nobody is filling" intro="What customers want that the current options don't give them.">
        {gaps.length > 0 ? <Findings items={gaps} tone="accent" /> : <p className="text-muted">No gaps were found.</p>}
      </Section>

      <Section title="How to get in" intro="Ways to position a better product against these complaints.">
        {strategies.length > 0 ? (
          <Findings items={strategies} tone="accent" />
        ) : (
          <p className="text-muted">No strategies were generated.</p>
        )}
      </Section>

      {(hasAds || adsLoading) && (
        <>
          <Section title="Ad angles" intro="Marketing positions that go straight at the complaints above.">
            {adsLoading && !hasAds && <Pending label="Writing ad angles, hooks and scripts…" />}
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              {(data.ad_angles ?? []).map((angle, i) => (
                <div key={i} className="border-t-2 border-foreground pt-4">
                  <h3 className="font-display text-lg font-semibold">{angle.name}</h3>
                  <dl className="mt-3 space-y-2.5 text-sm leading-relaxed">
                    <div><dt className="inline font-semibold">Pain: </dt><dd className="inline text-muted">{angle.customerPain}</dd></div>
                    <div><dt className="inline font-semibold">Hidden frustration: </dt><dd className="inline text-muted">{angle.hiddenFrustration}</dd></div>
                    <div><dt className="inline font-semibold">Market gap: </dt><dd className="inline text-muted">{angle.marketGap}</dd></div>
                    <div><dt className="inline font-semibold">Why it works: </dt><dd className="inline text-muted">{angle.whyItWorks}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          </Section>

          {(data.hooks?.length ?? 0) > 0 && (
            <Section title="Hooks" intro="Opening lines for the first one to three seconds of an ad.">
              <ul className="border-b border-border">
                {data.hooks!.map((hook, i) => (
                  <li key={i} className="border-t border-border py-5">
                    {hook.hookType && <p className="text-sm font-medium text-accent-ink">{hook.hookType}</p>}
                    <p className="mt-1 max-w-3xl font-display text-xl font-medium leading-snug">“{hook.hook}”</p>
                    {hook.visualDirection && (
                      <p className="mt-2 max-w-3xl text-sm text-muted">
                        <span className="font-semibold text-foreground">Visual: </span>{hook.visualDirection}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(data.scripts?.length ?? 0) > 0 && (
            <Section title="Video scripts" intro="Short ad scripts with the visual and the voiceover for each scene.">
              <div className="space-y-10">
                {data.scripts!.map((script, i) => (
                  <div key={i}>
                    <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                      <span className="font-semibold">{script.format || "Script"}</span>
                      {script.targetEmotion && <span className="text-muted">Aims for {script.targetEmotion.toLowerCase()}</span>}
                      {script.duration && <span className="text-muted">{script.duration}</span>}
                    </p>
                    <ol className="mt-3 border-b border-border">
                      {(script.scenes ?? []).map((scene, s) => (
                        <li key={s} className="grid gap-1 border-t border-border py-4 sm:grid-cols-[110px_1fr] sm:gap-6">
                          <span className="text-sm font-semibold">Scene {scene.sceneNumber}</span>
                          <div className="max-w-3xl space-y-1 text-sm leading-relaxed">
                            <p><span className="font-semibold">Visual: </span><span className="text-muted">{scene.visual}</span></p>
                            <p><span className="font-semibold">Voice: </span><span className="italic">“{scene.voice}”</span></p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </article>
  );
}
