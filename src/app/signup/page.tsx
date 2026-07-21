"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { User, Mail, Lock, ArrowRight, UserCircle, Loader2, Compass, ListChecks, Rocket } from "lucide-react";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all fields!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address!");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to create your account");
      }

      // Try to sign in the user to create a session; regardless of sign-in result
      // we redirect to the dashboard after account creation so duplicate accounts
      // are prevented server-side and the user lands in the app.
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        // If sign-in returned a session, redirect immediately. Otherwise still
        // redirect to dashboard (user can sign in manually if needed).
        if (signInData?.session) {
          router.push("/dashboard");
          return;
        }
      } catch (e) {
        console.error('Sign-in after signup failed:', e);
      }

      // Redirect to dashboard even if sign-in didn't produce a session.
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-2.5 bg-[#0A0A0A] border border-[#1F2937] rounded-md focus:ring-2 focus:ring-violet-500/40 outline-none text-[#E5E7EB] placeholder:text-[#A1A1AA] text-sm disabled:opacity-50 transition";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0A0A0A]">
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

      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-24 py-8 sm:py-12">
        <div className="max-w-sm w-full mx-auto space-y-4 sm:space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Create Account</h2>
            <p className="text-neutral-500 mt-2 text-xs sm:text-sm">Verify your email before your account becomes active</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-red-200 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-3 text-emerald-200 text-xs sm:text-sm">
              <p>{successMessage}</p>
            </div>
          )}

          <form className="space-y-3 sm:space-y-4" onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-neutral-600" />
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={loading} className={inputClass} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-400">Last Name</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-3 w-4 h-4 text-neutral-600" />
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={loading} className={inputClass} required />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-600" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className={inputClass} required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-600" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className={inputClass} minLength={6} maxLength={16} required />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full text-white py-2.5 rounded-md font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm sm:text-base"
                style={{
                  background: "linear-gradient(135deg, rgba(139,92,246,0.95), rgba(99,102,241,0.95))",
                  boxShadow: "0 0 28px rgba(139,92,246,0.22)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

          <p className="text-center text-xs sm:text-sm text-[#A1A1AA]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#E5E7EB] font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}