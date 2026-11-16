import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-6 pt-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <p className="max-w-xs text-sm leading-relaxed text-muted">
          Customer complaints, market gaps and ad angles for any product, built from what people actually say.
        </p>
        <nav className="flex gap-14 text-sm" aria-label="Footer">
          <div className="flex flex-col gap-2.5">
            <Link href="/analyze" className="text-muted hover:text-foreground">Analyze a product</Link>
            <Link href="/#how" className="text-muted hover:text-foreground">How it works</Link>
            <Link href="/#faq" className="text-muted hover:text-foreground">FAQ</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link href="/login" className="text-muted hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="text-muted hover:text-foreground">Create account</Link>
            <Link href="/dashboard" className="text-muted hover:text-foreground">Saved reports</Link>
          </div>
        </nav>
      </div>
      <div aria-hidden className="display pointer-events-none select-none whitespace-nowrap px-2 text-center text-[clamp(7rem,30vw,28rem)] leading-[0.74] text-foreground/[0.07]">
        caviti
      </div>
      <p className="relative -mt-4 pb-5 text-center text-xs text-muted">© {new Date().getFullYear()} Caviti</p>
    </footer>
  );
}
