import Link from "next/link";

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 24 24 8" stroke="var(--cavity)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="21.5" cy="21.5" r="2.4" fill="currentColor" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-md" aria-label="Caviti home">
      <LogoMark />
      <span className="display text-2xl max-[359px]:hidden">caviti</span>
    </Link>
  );
}
