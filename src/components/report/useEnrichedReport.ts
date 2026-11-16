"use client";

import { useEffect, useState } from "react";
import { parseSection } from "@/lib/report-metrics";
import type { ComplaintTheme, GuestReport } from "@/lib/report-data";

/** When no review clusters are available, turn the written complaints into themes for ad generation. */
function themesFromAnalysis(report: GuestReport): ComplaintTheme[] {
  const negatives = parseSection(report.market_data.analysis, "NEGATIVE POINTS").slice(0, 4);
  return negatives.map((text) => ({
    theme: text.length > 70 ? `${text.slice(0, 67)}...` : text,
    description: text,
    mentions: 1,
    quotes: [text],
  }));
}

/**
 * Fills in the parts of a report that are generated after the main analysis:
 * customer quotes grouped by complaint, then ad angles, hooks and scripts.
 * Parts that already exist (a saved report) are not requested again.
 */
export function useEnrichedReport(base: GuestReport | null) {
  // Enriched copy of `base`; ignored once `base` changes.
  const [enriched, setEnriched] = useState<{ source: GuestReport; report: GuestReport } | null>(null);
  const [themesLoading, setThemesLoading] = useState(false);
  const [adsLoading, setAdsLoading] = useState(false);

  useEffect(() => {
    if (!base) return;

    let cancelled = false;

    (async () => {
      let current = base;
      const update = (patch: Partial<GuestReport["market_data"]>) => {
        current = { ...current, market_data: { ...current.market_data, ...patch } };
        if (!cancelled) setEnriched({ source: base, report: current });
      };

      if (!current.market_data.complaint_themes?.length) {
        setThemesLoading(true);
        try {
          const res = await fetch("/api/fetch-real-reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productName: current.product_name }),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.complaint_themes) && data.complaint_themes.length > 0) {
              update({ complaint_themes: data.complaint_themes });
            }
          }
        } catch {
          /* the written analysis still covers complaints */
        }
        if (!cancelled) setThemesLoading(false);
      }

      const { ad_angles, hooks, scripts } = current.market_data;
      if (!ad_angles?.length && !hooks?.length && !scripts?.length) {
        const themes = current.market_data.complaint_themes?.length
          ? current.market_data.complaint_themes
          : themesFromAnalysis(current);
        if (themes.length === 0 || cancelled) return;

        setAdsLoading(true);
        try {
          const res = await fetch("/api/generate-ad-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ complaintThemes: themes, productName: current.product_name }),
          });
          if (res.ok) {
            const data = await res.json();
            update({
              ad_angles: Array.isArray(data?.ad_angles) ? data.ad_angles : [],
              hooks: Array.isArray(data?.hooks) ? data.hooks : [],
              scripts: Array.isArray(data?.scripts) ? data.scripts : [],
            });
          }
        } catch {
          /* ad content is optional */
        }
        if (!cancelled) setAdsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      setThemesLoading(false);
      setAdsLoading(false);
    };
  }, [base]);

  const report = enriched && enriched.source === base ? enriched.report : base;

  return { report, themesLoading, adsLoading, enriching: themesLoading || adsLoading };
}
