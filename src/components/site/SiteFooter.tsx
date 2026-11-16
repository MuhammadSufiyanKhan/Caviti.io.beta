import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Customer complaints, market gaps and ad angles for any product, built from what people actually say.
          </p>
        </div>
        <nav className="flex gap-12 text-sm" aria-label="Footer">
          <div className="flex flex-col gap-2">
            <Link href="/analyze" className="text-muted hover:text-foreground">Analyze a product</Link>
            <Link href="/#how" className="text-muted hover:text-foreground">How it works</Link>
            <Link href="/#faq" className="text-muted hover:text-foreground">FAQ</Link>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/login" className="text-muted hover:text-foreground">Sign in</Link>
            <Link href="/signup" className="text-muted hover:text-foreground">Create account</Link>
            <Link href="/dashboard" className="text-muted hover:text-foreground">Saved reports</Link>
          </div>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Caviti
      </div>
    </footer>
  );
}
