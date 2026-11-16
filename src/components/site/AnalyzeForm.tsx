"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface AnalyzeFormProps {
  initialValue?: string;
  size?: "lg" | "md";
  buttonLabel?: string;
}

export function AnalyzeForm({ initialValue = "", size = "lg", buttonLabel = "Analyze" }: AnalyzeFormProps) {
  const [value, setValue] = useState(initialValue);
  const router = useRouter();
  const inputId = useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) {
      document.getElementById(inputId)?.focus();
      return;
    }
    router.push(`/analyze?q=${encodeURIComponent(q)}`);
  };

  const big = size === "lg";

  return (
    <form
      onSubmit={submit}
      className={`flex w-full flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:border-accent sm:flex-row ${
        big ? "" : "max-w-2xl"
      }`}
    >
      <label htmlFor={inputId} className="sr-only">
        Product name or link
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={300}
        placeholder="Product name or link"
        className={`min-w-0 flex-1 rounded-xl bg-transparent px-4 text-foreground placeholder:text-muted/70 focus:outline-none ${
          big ? "h-14 text-base sm:text-lg" : "h-11 text-base"
        }`}
        style={{ outline: "none" }}
      />
      <button
        type="submit"
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-accent font-medium text-white hover:bg-accent-ink ${
          big ? "h-14 px-7 text-base" : "h-11 px-5 text-sm"
        }`}
      >
        {buttonLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
