"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
  onSuccess: () => void;
  /** Called when the visitor wants the other form (used by the modal). */
  onSwitchMode?: (mode: Mode) => void;
}

const field =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-60";

export function AuthForm({ mode, onSuccess, onSwitchMode }: AuthFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) {
      setError("Enter your first and last name.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("Use a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstName: firstName.trim(), lastName: lastName.trim() }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || "Could not create your account.");
      }

      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchTo = (next: Mode) => (e: React.MouseEvent) => {
    if (onSwitchMode) {
      e.preventDefault();
      onSwitchMode(next);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {mode === "signup" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">First name</span>
            <input className={field} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" disabled={loading} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Last name</span>
            <input className={field} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" disabled={loading} />
          </label>
        </div>
      )}

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Email</span>
        <input
          type="email"
          className={field}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@company.com"
          disabled={loading}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 flex items-center justify-between font-medium">
          Password
          {mode === "login" && (
            <Link href="/auth/forgot-password" className="text-xs font-normal text-accent-ink hover:underline">
              Forgot password?
            </Link>
          )}
        </span>
        <input
          type="password"
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          disabled={loading}
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
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent-ink disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? "New to Caviti? " : "Already have an account? "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          onClick={switchTo(mode === "login" ? "signup" : "login")}
          className="font-medium text-accent-ink hover:underline"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
