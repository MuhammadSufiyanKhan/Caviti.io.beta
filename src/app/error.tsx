"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AppError({ error }: { error: Error }) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center px-4">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20">
        <h1 className="text-3xl font-black mb-4">Something went wrong</h1>
        <p className="text-sm text-slate-300 mb-6">
          An unexpected error occurred while loading this page. Please refresh or try again later.
        </p>
        <button
          type="button"
          onClick={() => setShowDetails((prev) => !prev)}
          className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
        {showDetails && (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950/80 p-4 text-xs text-slate-300">{error.message}</pre>
        )}
        <div className="mt-6 flex gap-3 flex-wrap">
          <Link href="/" className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-950">
            Return home
          </Link>
          <button onClick={() => window.location.reload()} className="rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm text-white">
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
