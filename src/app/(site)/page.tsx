import Link from "next/link";
import { AnalyzeForm } from "@/components/site/AnalyzeForm";

const EXAMPLES = ["cordless vacuum", "ergonomic office chair", "protein powder", "robot lawn mower"];

const STEPS = [
  {
    title: "Paste a product or a link",
    body: "Type what you sell, what a competitor sells, or paste a product page. No account is needed.",
  },
  {
    title: "Read the report",
    body: "In about twenty seconds you get the complaints, the gaps, and a plan for getting in.",
  },
  {
    title: "Save the ones worth keeping",
    body: "Flip the save switch on a report. Create a free account when asked and it lands on your dashboard.",
  },
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
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
        <div>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Find the cavities in any product.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Paste a product name or link. Caviti reads what customers say, then shows you the complaints,
            the gaps nobody fills, and ad angles built on both. No account needed.
          </p>
          <div className="mt-9 max-w-xl">
            <AnalyzeForm />
          </div>
          <p className="mt-4 text-sm text-muted">
            Try{" "}
            {EXAMPLES.map((ex, i) => (
              <span key={ex}>
                <Link
                  href={`/analyze?q=${encodeURIComponent(ex)}`}
                  className="text-foreground underline decoration-border underline-offset-4 hover:decoration-accent"
                >
                  {ex}
                </Link>
                {i < EXAMPLES.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>

        {/* Example finding */}
        <figure aria-label="Example of a finding" className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <figcaption className="text-sm text-muted">Example finding for “cordless vacuum”</figcaption>
          <h2 className="mt-3 font-display text-xl font-semibold">Battery dies before the job is done</h2>
          <blockquote className="mt-4 border-l-2 border-cavity pl-4 italic leading-relaxed">
            {"“Great suction, but I get "}
            <span className="mark-cavity">maybe ten minutes</span>
            {" before it quits and I'm only halfway through the house.”"}
          </blockquote>
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-sm font-semibold">The gap</p>
            <p className="mt-1 leading-relaxed text-muted">
              A swappable battery that lets people finish a full clean without waiting to recharge.
            </p>
          </div>
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-sm font-semibold">The ad hook</p>
            <p className="mt-1 font-display text-lg leading-snug">“Finish the whole house. Not half of it.”</p>
          </div>
        </figure>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            From a product name to a plan in three steps
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="font-display text-5xl font-semibold text-accent/40">{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What's in a report */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              What you get in every report
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Everything is built from what customers already said, so you start from evidence instead of a guess.
            </p>
          </div>
          <dl className="border-b border-border">
            {[
              ["Customer complaints", "Grouped by theme, with the quotes behind each one and how often they came up."],
              ["Market gaps", "What people want that the current products don't give them."],
              ["Entry strategies", "How to position a better product against those complaints."],
              ["Ad angles, hooks and scripts", "Ready-to-test creative that goes straight at the problems customers named."],
            ].map(([term, desc]) => (
              <div key={term} className="grid gap-1 border-t border-border py-5 sm:grid-cols-[220px_1fr] sm:gap-6">
                <dt className="font-semibold">{term}</dt>
                <dd className="leading-relaxed text-muted">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
          <div className="mt-8 border-b border-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group border-t border-border py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Run your first analysis now
          </h2>
          <p className="mb-8 mt-3 text-muted">It takes about twenty seconds and costs nothing.</p>
          <AnalyzeForm />
        </div>
      </section>
    </main>
  );
}
