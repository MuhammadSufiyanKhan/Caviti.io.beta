import { parseSection } from "@/lib/report-metrics";
import type { GuestReport } from "@/lib/report-data";

/** Plain-text/markdown copy of a whole report, for pasting into docs or chat. */
export function reportToMarkdown(report: GuestReport): string {
  const { product_name: name, market_data: d } = report;
  const lines: string[] = [`# ${name}`, ""];

  const section = (title: string, items: string[]) => {
    if (!items.length) return;
    lines.push(`## ${title}`, ...items.map((i) => `- ${i}`), "");
  };

  if (d.complaint_themes?.length) {
    lines.push("## Complaint themes");
    d.complaint_themes.forEach((t) => {
      lines.push(`- ${t.theme}${t.mentions ? ` (${t.mentions} mentions)` : ""}`);
      (t.quotes ?? []).forEach((q) => lines.push(`  - “${q}”`));
    });
    lines.push("");
  }
  section("Customer complaints", parseSection(d.analysis, "NEGATIVE POINTS"));
  section("Market gaps", parseSection(d.analysis, "MARKET GAPS"));
  section("Entry strategies", parseSection(d.analysis, "ENTRY STRATEGIES"));

  if (d.ad_angles?.length) {
    lines.push("## Ad angles");
    d.ad_angles.forEach((a) =>
      lines.push(`- ${a.name}: ${a.customerPain} Gap: ${a.marketGap} Why it works: ${a.whyItWorks}`)
    );
    lines.push("");
  }
  section("Hooks", (d.hooks ?? []).map((h) => `“${h.hook}”`));
  return lines.join("\n").trim() + "\n";
}
