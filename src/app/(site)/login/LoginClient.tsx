"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export function LoginClient() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <AuthShell title="Sign in" subtitle="Pick up where you left off and find your saved reports.">
        <AuthForm
          mode="login"
          onSuccess={() => {
            router.push(safeNext);
            router.refresh();
          }}
        />
    </AuthShell>
  );
}
