"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export function LoginClient() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-14 sm:py-20">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Sign in</h1>
      <p className="mb-8 mt-2 text-muted">Pick up where you left off and find your saved reports.</p>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <AuthForm
          mode="login"
          onSuccess={() => {
            router.push(safeNext);
            router.refresh();
          }}
        />
      </div>
    </main>
  );
}
