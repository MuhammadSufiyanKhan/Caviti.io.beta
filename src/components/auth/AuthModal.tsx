"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, mode, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border bg-surface p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-modal-title" className="display text-4xl">
              {mode === "signup" ? "Save this report" : "Sign in to save"}
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              {mode === "signup"
                ? "Create a free account and this report goes straight to your dashboard."
                : "Sign in and this report goes straight to your dashboard."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <AuthForm mode={mode} onSuccess={onAuthenticated} onSwitchMode={setMode} />
      </div>
    </div>
  );
}
