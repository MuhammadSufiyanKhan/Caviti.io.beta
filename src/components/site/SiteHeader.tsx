"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";

export function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await createClient().auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted sm:flex" aria-label="Main">
            <Link href="/analyze" className="hover:text-foreground">Analyze a product</Link>
            <Link href="/#how" className="hover:text-foreground">How it works</Link>
            {user && <Link href="/dashboard" className="hover:text-foreground">Saved reports</Link>}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <ThemeToggle />
          <div className="flex items-center gap-2" style={{ visibility: ready ? "visible" : "hidden" }}>
          {user ? (
            <>
              <span className="hidden max-w-[180px] truncate text-muted md:inline" title={user.email ?? ""}>
                {user.email}
              </span>
              <Link
                href="/dashboard"
                className="rounded-full bg-accent px-3.5 py-2 font-medium text-on-accent hover:brightness-110 sm:px-4"
              >
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="rounded-lg px-2 py-2 text-muted hover:text-foreground sm:px-3"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-muted hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-foreground px-4 py-2 font-medium text-background hover:opacity-85"
              >
                Create account
              </Link>
            </>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
