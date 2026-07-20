"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, Compass, ListChecks, Rocket } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0A0A]">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] border-r border-[#1F2937] p-8 xl:p-12 flex-col justify-between">
        <div className="text-white text-xl sm:text-2xl font-bold tracking-tighter">Caviti.io</div>
        <div className="flex-1 flex items-center justify-center mt-10 mb-8">
          <div className="w-full max-w-[320px]">
            <div className="rounded-[12px] border border-white/6 bg-white/3 p-6 backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-blue-400">
                    <Compass className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Discover</div>
                    <div className="text-neutral-400 text-xs">Uncover real customer problems from reviews</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-600">
                    <ListChecks className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Prioritize</div>
                    <div className="text-neutral-400 text-xs">Turn issues into a short list of high-impact fixes</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Launch</div>
                    <div className="text-neutral-400 text-xs">Test ad angles and creative that actually convert</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-neutral-200 text-sm sm:text-base font-semibold">Evidence-first market insights</h3>
          <p className="text-neutral-500 mt-2 text-sm">Find what customers actually say, prioritize fixes, and test ad angles that work.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-24 py-8 sm:py-12">
        <div className="max-w-sm w-full mx-auto space-y-6 sm:space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sign In</h2>
            <p className="text-neutral-500 mt-2 text-sm sm:text-base">Welcome back to Caviti.io</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#1F2937] bg-[#0A0A0A] rounded-md focus:ring-2 focus:ring-violet-500/40 outline-none text-[#E5E7EB] placeholder:text-[#A1A1AA] disabled:opacity-50 transition text-sm sm:text-base"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#1F2937] bg-[#0A0A0A] rounded-md focus:ring-2 focus:ring-violet-500/40 outline-none text-[#E5E7EB] placeholder:text-[#A1A1AA] disabled:opacity-50 transition text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2.5 rounded-md font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.95))",
                boxShadow: "0 0 28px rgba(139,92,246,0.22)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <Link 
              href="/auth/forgot-password" 
              className="text-xs sm:text-sm text-center text-[#A1A1AA] hover:text-[#E5E7EB] transition"
            >
              Forgot password?
            </Link>
          </form>

          <p className="text-center text-xs sm:text-sm text-[#A1A1AA]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#E5E7EB] font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
