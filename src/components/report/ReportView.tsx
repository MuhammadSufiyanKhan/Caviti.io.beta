"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, ListChecks, Loader2, X } from "lucide-react";
import { parseSection } from "@/lib/report-metrics";
import { reportToMarkdown } from "@/lib/report-markdown";
import { scrollToId } from "@/lib/smooth-scroll";
import type { GuestReport } from "@/lib/report-data";
import { Reveal } from "@/components/site/Reveal";
import { AngleCards } from "@/components/report/AngleCards";
import { GapBoard } from "@/components/report/GapBoard";
import { HookStage } from "@/components/report/HookStage";
import { ComplaintExplorer, type ComplaintItem } from "@/components/report/ComplaintExplorer";
import { CopyButton } from "@/components/report/CopyButton";
import { Inline } from "@/components/report/Inline";
import { PickList, type PlanKind } from "@/components/report/PickList";
import { ReportNav, type NavItem } from "@/components/report/ReportNav";
import { ScriptPlayer } from "@/components/report/ScriptPlayer";
import { StatCounter } from "@/components/report/StatCounter";

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <Reveal as="section" id={id} className="scroll-mt-28 pb-20">
      <h2 className="display text-[clamp(2.2rem,5vw,4rem)]">{title}</h2>
      {intro && <p className="mt-3 max-w-2xl text-lg text-muted">{intro}</p>}
      <div className="mt-8">{children}</div>
    </Reveal>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted" role="status">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </p>
  );
}

const KIND_LABEL: Record<PlanKind, string> = { gap: "Gap to fill", strategy: "Way in" };

/** Short title for a written complaint when no grouped themes exist. */
function titleOf(text: string) {
  const plain = text.replace(/\*\*/g, "");
  const first = plain.split(/[.:;]\s|\s[—–-]\s/)[0];
  return first.length > 90 ? `${first.slice(0, 88)}…` : first;
}

interface ReportViewProps {
  report: GuestReport;
  themesLoading: boolean;
  adsLoading: boolean;
  /** Shown under the stats: the save toggle, or saved status. */
  actions?: ReactNode;
  dateLabel?: string;
}

export function ReportView({ report, themesLoading, adsLoading, actions, dateLabel }: ReportViewProps) {
  const { product_name: name, market_data: data } = report;
  const negatives = parseSection(data.analysis, "NEGATIVE POINTS");
  const gaps = parseSection(data.analysis, "MARKET GAPS");
  const strategies = parseSection(data.analysis, "ENTRY STRATEGIES");
  const themes = (data.complaint_themes ?? []).filter((t) => t && (t.theme || (t.quotes ?? []).length > 0));
  const angles = data.ad_angles ?? [];
  const hooks = data.hooks ?? [];
  const scripts = (data.scripts ?? []).filter((s) => (s.scenes?.length ?? 0) > 0);
  const hasAds = angles.length > 0 || hooks.length > 0 || scripts.length > 0;

  // Your plan: gaps and strategies the reader picks.
  const [plan, setPlan] = useState<{ kind: PlanKind; text: string }[]>([]);
  const isPicked = useCallback((kind: PlanKind, text: string) => plan.some((p) => p.kind === kind && p.text === text), [plan]);
  const toggle = useCallback((kind: PlanKind, text: string) => {
    setPlan((prev) =>
      prev.some((p) => p.kind === kind && p.text === text)
        ? prev.filter((p) => !(p.kind === kind && p.text === text))
        : [...prev, { kind, text }]
    );
  }, []);
  const planText = () =>
    `Plan for ${name}\n` + plan.map((p) => `- [${KIND_LABEL[p.kind]}] ${p.text.replace(/\*\*/g, "")}`).join("\n");

  const complaintItems: ComplaintItem[] = useMemo(() => {
    if (themes.length > 0) {
      return themes.map((t, i) => ({
        id: `t-${i}`,
        title: t.theme,
        mentions: t.mentions,
        description: t.description,
        quotes: t.quotes ?? [],
      }));
    }
    return negatives.map((text, i) => ({ id: `n-${i}`, title: titleOf(text), description: text, quotes: [] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.analysis, data.complaint_themes]);

  const navItems: NavItem[] = [
    { id: "complaints", label: "Complaints" },
    { id: "gaps", label: "Gaps" },
    { id: "strategy", label: "How to get in" },
    ...(angles.length || adsLoading ? [{ id: "angles", label: "Ad angles" }] : []),
    ...(hooks.length ? [{ id: "hooks", label: "Hooks" }] : []),
    ...(scripts.length ? [{ id: "scripts", label: "Scripts" }] : []),
    ...(plan.length ? [{ id: "plan", label: `Your plan (${plan.length})` }] : []),
  ];

  const stats = [
    typeof data.reviews_count === "number" && data.reviews_count > 0
      ? { value: data.reviews_count, label: "reviews and snippets read" }
      : null,
    { value: negatives.length, label: "complaints found" },
    { value: gaps.length, label: "market gaps" },
    data.average_rating ? { value: data.average_rating, label: "average star rating" } : null,
  ].filter(Boolean) as { value: string | number; label: string }[];

  return (
    <div>
      <header>
        <h1 className="display text-[clamp(3rem,9vw,7.5rem)] capitalize">{name}</h1>
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

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-6 sm:grid-cols-4">
          {stats.map((s) => (
            <StatCounter key={s.label} value={s.value} label={s.label} />
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          {actions}
          <CopyButton label="Copy whole report" getText={() => reportToMarkdown(report)} />
        </div>
      </header>

      <div className="mt-12 lg:grid lg:grid-cols-[170px_minmax(0,1fr)] lg:gap-14">
        <ReportNav items={navItems} />

        <div>
          <Section
            id="complaints"
            title="What customers complain about"
            intro="Pick a complaint to see the evidence behind it. Longer bars came up more often."
          >
            {themesLoading && <div className="mb-5"><Pending label="Grouping customer quotes by complaint…" /></div>}
            {complaintItems.length > 0 ? (
              <ComplaintExplorer key={complaintItems[0].id + complaintItems.length} items={complaintItems} />
            ) : (
              <p className="text-muted">No complaints were found for this product.</p>
            )}
            {themes.length > 0 && negatives.length > 0 && (
              <details className="group mt-8 border-t border-border pt-5">
                <summary className="cursor-pointer list-none font-semibold text-accent-ink hover:underline">
                  Read the written analysis
                </summary>
                <ul className="mt-4 space-y-3">
                  {negatives.map((n) => (
                    <li key={n} className="flex gap-3 text-lg leading-relaxed">
                      <span aria-hidden className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-cavity" />
                      <span><Inline text={n} /></span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Section>

          <Section
            id="gaps"
            title="Gaps nobody is filling"
            intro="What customers want that the current options don't give them. Fill the gaps worth going after and they join your plan."
          >
            {gaps.length > 0 ? (
              <GapBoard items={gaps} isPicked={isPicked} onToggle={toggle} />
            ) : (
              <p className="text-muted">No gaps were found.</p>
            )}
          </Section>

          <Section id="strategy" title="How to get in" intro="Ways to position a better product against these complaints.">
            {strategies.length > 0 ? (
              <PickList items={strategies} kind="strategy" isPicked={isPicked} onToggle={toggle} />
            ) : (
              <p className="text-muted">No strategies were generated.</p>
            )}
          </Section>

          {(hasAds || adsLoading) && (
            <>
              <Section id="angles" title="Ad angles" intro="Marketing positions that go straight at the complaints above. Tap a card to see the thinking behind it.">
                {adsLoading && !hasAds && <Pending label="Writing ad angles, hooks and scripts…" />}
                <AngleCards angles={angles} />
              </Section>

              {hooks.length > 0 && (
                <Section id="hooks" title="Hooks" intro="Opening lines for the first three seconds of an ad. Pick one to watch it play.">
                  <HookStage hooks={hooks} />
                </Section>
              )}

              {scripts.length > 0 && (
                <Section id="scripts" title="Video scripts" intro="Press play to step through each scene, or jump to one.">
                  <div className="space-y-6">
                    {scripts.map((script, i) => (
                      <ScriptPlayer key={i} script={script} />
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {plan.length > 0 && (
            <Section id="plan" title="Your plan" intro="The gaps and strategies you picked, ready to copy.">
              <ul className="border-b border-border">
                {plan.map((item) => (
                  <li key={`${item.kind}-${item.text}`} className="flex items-start gap-4 border-t border-border py-4">
                    <span className="mt-1 shrink-0 rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-medium text-accent-ink">
                      {KIND_LABEL[item.kind]}
                    </span>
                    <p className="min-w-0 flex-1 text-lg leading-relaxed"><Inline text={item.text} /></p>
                    <button
                      type="button"
                      onClick={() => toggle(item.kind, item.text)}
                      aria-label="Remove from plan"
                      className="mt-1 rounded-full p-1.5 text-muted hover:bg-cavity-muted hover:text-cavity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-5"><CopyButton label="Copy plan" getText={planText} /></div>
            </Section>
          )}
        </div>
      </div>

      {plan.length > 0 && (
        <button
          type="button"
          onClick={() => scrollToId("plan")}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg hover:opacity-90"
        >
          <ListChecks className="h-4 w-4" /> Your plan ({plan.length})
        </button>
      )}
    </div>
  );
}
