"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  const router = useRouter();

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-14 sm:py-20">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Create your account</h1>
      <p className="mb-8 mt-2 text-muted">
        Free. You only need it to save reports. Analyzing products works without one.
      </p>
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <AuthForm
          mode="signup"
          onSuccess={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        />
      </div>
    </main>
  );
}
