"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export default function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        const type = searchParams.get("type") || "email_verification";

        if (!token) {
          setStatus("error");
          setMessage("No verification token found");
          return;
        }

        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, type }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully");
          setTimeout(() => router.push("/dashboard"), 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage("An error occurred during verification");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0A] to-[#111111] px-4 sm:px-8">
      <div className="max-w-sm w-full space-y-6 sm:space-y-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 animate-spin mx-auto" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Verifying Email</h2>
              <p className="text-neutral-400 text-sm sm:text-base mt-2">Please wait...</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Email Verified</h2>
              <p className="text-neutral-400 text-sm sm:text-base mt-2">{message}</p>
              <p className="text-neutral-500 text-xs sm:text-sm mt-4">Redirecting to dashboard...</p>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Verification Failed</h2>
              <p className="text-neutral-400 text-sm sm:text-base mt-2">{message}</p>
            </div>
            <div className="space-y-2 pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                Back to Sign In <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
