"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "We couldn't send the reset email.");
      else setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send you a reset link.">
        {sent ? (
          <p role="status" className="leading-relaxed">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            </label>
            {error && (
              <p role="alert" className="rounded-lg border border-cavity/30 bg-cavity-muted px-3 py-2 text-sm text-cavity">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-on-accent hover:brightness-110 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-accent-ink hover:underline">Back to sign in</Link>
        </p>
    </AuthShell>
  );
}
