import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnalyzeForm } from "@/components/site/AnalyzeForm";
import { ScanSpecimen } from "@/components/site/ScanSpecimen";
import { StatementReveal } from "@/components/site/StatementReveal";
import { ReviewToAd } from "@/components/site/ReviewToAd";

const EXAMPLES = ["cordless vacuum", "ergonomic office chair", "protein powder", "robot lawn mower"];

const REPORT_PARTS = [
  {
    title: "Customer complaints",
    body: "Grouped by theme, with the quotes behind each one and how often they came up.",
  },
  { title: "Market gaps", body: "What people want that the products on the shelf don't give them." },
  { title: "Entry strategies", body: "How to position a better product against exactly those complaints." },
  {
    title: "Ads, hooks and scripts",
    body: "Creative you can test straight away, written against the problems customers named.",
  },
];

const FREE_FACTS = [
  ["Analyze any product", "No account"],
  ["Read the full report", "No account"],
  ["Save it and come back", "Free account"],
];

const FAQ = [
  {
    q: "Do I need an account to use Caviti?",
    a: "No. You can analyze products and read full reports without signing in. You only need an account to save a report and find it again later.",
  },
  {
    q: "Where does the data come from?",
    a: "Google search results and shopping reviews for the product you enter. An AI model then groups what it finds into complaints, gaps and strategies.",
  },
  {
    q: "How much should I trust a report?",
    a: "Treat it as a fast first pass. Quotes come from public reviews and snippets, so check anything you plan to build a decision or an ad on.",
  },
  {
    q: "What happens when I save a report?",
    a: "It is stored in your dashboard exactly as you saw it, including the ad angles, hooks and scripts. Switch it off and it is removed.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="chart-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
          <h1 className="display text-[clamp(3.4rem,11.5vw,10.5rem)]">
            Find the cavities
            <br />
            in any product.
          </h1>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-16">
            <div>
              <p className="max-w-lg text-lg leading-relaxed text-muted sm:text-xl">
                Paste a product name or link. Caviti reads what customers say, then shows you the complaints,
                the gaps nobody fills, and ad angles built on both. No account needed.
              </p>
              <div className="mt-8 max-w-xl">
                <AnalyzeForm />
              </div>
              <p className="mt-5 text-sm text-muted">
                Try{" "}
                {EXAMPLES.map((ex, i) => (
                  <span key={ex}>
                    <Link
                      href={`/analyze?q=${encodeURIComponent(ex)}`}
                      className="text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-accent"
                    >
                      {ex}
                    </Link>
                    {i < EXAMPLES.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </div>
            <ScanSpecimen />
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-40">
          <StatementReveal
            text="Customers already told the internet exactly what is broken. Caviti reads all of it, so you start from the cavities, not from a guess."
            marks={["broken", "cavities"]}
          />
        </div>
      </section>

      {/* Review to ad */}
      <section id="how" className="scroll-mt-20 border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <h2 className="display max-w-4xl text-[clamp(2.6rem,6.5vw,5.5rem)]">
            From one angry review to a finished ad.
          </h2>
          <p className="mb-16 mt-5 max-w-xl text-lg text-muted">
            Every report follows the same path. Here is one example, start to finish.
          </p>
          <ReviewToAd />
        </div>
      </section>

      {/* What you get */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <h2 className="display max-w-3xl text-[clamp(2.6rem,6.5vw,5.5rem)]">What every report contains</h2>
          <ul className="mt-16 border-b border-border">
            {REPORT_PARTS.map((part) => (
              <li
                key={part.title}
                className="group grid gap-3 border-t border-border py-8 transition-colors hover:bg-accent-muted/40 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-12 md:px-4"
              >
                <h3 className="display text-[clamp(2rem,4.6vw,4rem)] transition-transform duration-300 group-hover:translate-x-2">
                  {part.title}
                </h3>
                <p className="max-w-md text-lg leading-relaxed text-muted">{part.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Free to try */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-2 lg:items-center">
          <h2 className="display text-[clamp(2.6rem,6.5vw,5.5rem)]">Try everything first. Sign up only to keep it.</h2>
          <div>
            <ul className="border-b border-border">
              {FREE_FACTS.map(([what, cost]) => (
                <li key={what} className="flex items-center justify-between gap-4 border-t border-border py-5 text-lg">
                  <span>{what}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      cost === "No account" ? "bg-accent-muted text-accent-ink" : "border border-border text-muted"
                    }`}
                  >
                    {cost}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-4 text-sm text-muted">
              <span aria-hidden className="relative h-7 w-12 rounded-full bg-accent">
                <span className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-on-accent" />
              </span>
              One switch on any report saves it to your dashboard.
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 sm:py-32 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="display text-[clamp(2.6rem,6vw,5rem)]">Questions</h2>
          <div className="border-b border-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-t border-border py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold sm:text-xl">
                  {item.q}
                  <span aria-hidden className="text-3xl font-light text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-36">
          <h2 className="display text-[clamp(3rem,9vw,8rem)]">
            Run your first scan.
          </h2>
          <p className="mb-10 mt-6 text-lg text-muted">It takes about twenty seconds and costs nothing.</p>
          <div className="max-w-2xl">
            <AnalyzeForm />
          </div>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
          >
            Or create a free account first <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
