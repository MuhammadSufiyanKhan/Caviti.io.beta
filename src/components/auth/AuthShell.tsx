import type { ReactNode } from "react";
import { ScanSpecimen } from "@/components/site/ScanSpecimen";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Two-column layout for sign-in, sign-up and password reset. */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative overflow-hidden">
      <div aria-hidden className="chart-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-14 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="max-w-md">
          <h1 className="display text-[clamp(3rem,7vw,5.5rem)]">{title}</h1>
          <p className="mb-8 mt-5 text-lg text-muted">{subtitle}</p>
          <div className="rounded-3xl border border-border bg-surface/90 p-6 backdrop-blur sm:p-8">{children}</div>
        </div>
        <div className="hidden lg:block">
          <ScanSpecimen />
        </div>
      </div>
    </main>
  );
}
