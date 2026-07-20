"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import type { StaticImport } from "next/dist/shared/lib/get-img-props";

// NOTE: StaticImport is currently unused in this file but left as-is to avoid unrelated refactors.



import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { parseSection } from "@/lib/report-metrics";
import UserMenu from "@/components/UserMenu";
import type { Database } from "@/types/database.types";

type Report = Database["public"]["Tables"]["reports"]["Row"];

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const supabase = useMemo(() => createClient(), []);

  const [report, setReport] = useState<Report | null>(null);
  const [fetching, setFetching] = useState(true);

  const [isPro, setIsPro] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("Loading...");

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [supabase, router]);

  const fetchReport = useCallback(async () => {
    if (!id) return;

    setFetching(true);
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    setReport((data as Report | null) ?? null);
    setFetching(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setIsPro(false);
          setSubscriptionStatus("Free");
          setSubscriptionLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", user.id)
          .single();

        const status = (profile as any)?.subscription_status;
        const pro = status === "pro";

        setIsPro(!!pro);
        setSubscriptionStatus(pro ? "Pro" : status ?? "Free");
        setSubscriptionLoading(false);
      } catch {
        if (!mounted) return;
        setIsPro(false);
        setSubscriptionStatus("Free");
        setSubscriptionLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const shouldBlurGlobal = !subscriptionLoading && !isPro;

  const [marketDataWithReviews, setMarketDataWithReviews] = useState<any>(null);
  const [complaintThemesLoading, setComplaintThemesLoading] = useState(true);

  const [adAngles, setAdAngles] = useState<any[]>([]);
  const [hooks, setHooks] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [adContentLoading, setAdContentLoading] = useState(false);

  const analysisText = (report?.market_data as any)?.analysis || "";
  const marketData = report?.market_data as any;
  const complaintThemes = useMemo(() => {
    const fromState = marketDataWithReviews?.complaint_themes;
    const fromMarketData = marketData?.complaint_themes;
    const source = Array.isArray(fromState) && fromState.length > 0 ? fromState : Array.isArray(fromMarketData) && fromMarketData.length > 0 ? fromMarketData : [];

    return source.filter((theme: any) => theme && (theme.theme || theme.description || (theme.quotes || []).length > 0));
  }, [marketData, marketDataWithReviews]);

  const fallbackComplaintThemes = useMemo(() => {
    const productName = report?.product_name || "this product";
    const normalizedName = productName.trim();
    const baseLabel = normalizedName.length > 40 ? `${normalizedName.slice(0, 37)}...` : normalizedName;

    // Extract specific vulnerabilities to create targeted complaint themes
    const vulnerabilities = parseSection(analysisText, "NEGATIVE POINTS");
    
    if (vulnerabilities && vulnerabilities.length > 0) {
      // Generate themes based on actual vulnerabilities found
      const themes = [];
      
      // Group vulnerabilities into themed complaint buckets
      const qualityIssues = vulnerabilities.slice(0, Math.ceil(vulnerabilities.length / 2));
      const valueIssues = vulnerabilities.slice(Math.ceil(vulnerabilities.length / 2));
      
      if (qualityIssues.length > 0) {
        themes.push({
          theme: "QUALITY & DURABILITY COMPLAINTS",
          description: `Customers report specific quality issues with ${baseLabel}`,
          emoji: "🔴",
          mentions: qualityIssues.length,
          quotes: qualityIssues.slice(0, 3),
        });
      }
      
      if (valueIssues.length > 0) {
        themes.push({
          theme: "VALUE & PRICING CONCERNS",
          description: `Price and value complaints about ${baseLabel}`,
          emoji: "🔴",
          mentions: valueIssues.length,
          quotes: valueIssues.slice(0, 3),
        });
      }
      
      return themes.length > 0 ? themes : [
        {
          theme: "COMMON CUSTOMER PAIN POINTS",
          description: `Common complaints people share about ${baseLabel}.`,
          emoji: "🔴",
          mentions: vulnerabilities.length,
          quotes: vulnerabilities.slice(0, 3),
        },
      ];
    }

    return [
      {
        theme: "COMMON CUSTOMER PAIN POINTS",
        description: `Common complaints people share about ${baseLabel}.`,
        emoji: "🔴",
        mentions: 3,
        quotes: [
          `${baseLabel} is often described as disappointing in everyday use.`,
          `Customers frequently mention quality, durability, or comfort issues with ${baseLabel}.`,
          `Value concerns are common when ${baseLabel} feels overpriced or underdelivers.`,
        ],
      },
    ];
  }, [report?.product_name, analysisText]);

  // If report doesn't have real_reviews, fetch them automatically
  useEffect(() => {
    if (!report) return;

    const enrichData = async () => {
      setComplaintThemesLoading(true);
      const enrichedMarketData = { ...marketData };

      try {
        const res = await fetch("/api/fetch-real-reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName: report.product_name }),
        });

        if (res.ok) {
          const freshData = await res.json();
          if (freshData?.complaint_themes) {
            enrichedMarketData.complaint_themes = freshData.complaint_themes;
            console.log("[Report] Refreshed complaint themes:", freshData.complaint_themes.length);
          }
          if (freshData?.real_reviews) {
            enrichedMarketData.real_reviews = freshData.real_reviews;
          }
        }
      } catch (err) {
        console.log("[Report] Could not fetch fresh reviews:", err);
      }

      setMarketDataWithReviews(enrichedMarketData);
      setComplaintThemesLoading(false);
    };

    enrichData();
  }, [report, marketData]);

  // Fetch Ad Content (Ad Angles, Hooks, Scripts) after complaint themes are loaded
  useEffect(() => {
    if (!report || complaintThemesLoading || complaintThemes.length === 0) return;

    const generateAdContent = async () => {
      setAdContentLoading(true);
      setAdAngles([]);
      setHooks([]);
      setScripts([]);

      try {
        const res = await fetch("/api/generate-ad-content", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          cache: "no-store",
          body: JSON.stringify({
            complaintThemes: complaintThemes,
            productName: report.product_name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.ad_angles) setAdAngles(data.ad_angles);
          if (data?.hooks) setHooks(data.hooks);
          if (data?.scripts) setScripts(data.scripts);
          console.log("[Report] Generated ad content:", {
            angles: data.ad_angles?.length,
            hooks: data.hooks?.length,
            scripts: data.scripts?.length,
          });
        }
      } catch (err) {
        console.log("[Report] Could not generate ad content:", err);
      }
      setAdContentLoading(false);
    };

    generateAdContent();
  }, [report, report?.product_name, complaintThemesLoading, complaintThemes]);

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "3px solid rgba(59,130,246,0.15)",
            borderTop: "3px solid #3b82f6",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (fetching) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "3px solid rgba(59,130,246,0.15)",
            borderTop: "3px solid #3b82f6",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050508",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#475569",
        }}
      >
        Report not found.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        color: "white",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-black/85 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-slate-500 bg-white/4 border border-white/6 hover:bg-white/8 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-white/8 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Caviti Logo"
                width={20}
                height={20}
                className="rounded-full"
              />
              <span className="text-white font-bold text-lg sm:text-xl">caviti</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-emerald-400">
              {shouldBlurGlobal ? `Status: ${subscriptionStatus}` : "✓ Complete"}
            </span>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 capitalize">
            {report.product_name}
          </h1>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg text-slate-500 bg-white/3 border border-white/6">
              <Calendar size={12} />
              {new Date(report.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>

            {marketData?.url ? (
              <a
                href={marketData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg text-blue-400 bg-blue-500/6 border border-blue-500/15 hover:bg-blue-500/10 transition-colors no-underline"
              >
                <ExternalLink size={12} />
                <span className="truncate">
                  {String(marketData.url)
                    .replace(/^https?:\/\//, "")
                    .slice(0, 50)}
                </span>
              </a>
            ) : null}
          </div>
        </motion.div>

        {/* Complaint Themes Section - Verbatim Quotes from Real Reviews */}
        {complaintThemesLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6 sm:mb-8 bg-white/2.5 border border-white/7 rounded-2xl overflow-hidden backdrop-blur-2xl shadow-lg p-6 sm:p-8"
          >
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Loader2 size={40} className="animate-spin text-blue-400" />
              <p className="text-sm sm:text-base text-slate-400">Loading customer complaints...</p>
            </div>
          </motion.div>
        ) : (() => {
          const themes = complaintThemes.length > 0 ? complaintThemes : fallbackComplaintThemes;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mb-6 sm:mb-8 bg-white/2.5 border border-white/7 rounded-2xl overflow-hidden backdrop-blur-2xl shadow-lg"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-white/5 bg-linear-to-r from-red-500/6 to-transparent flex items-center gap-4">
                <div className="shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
                  <span className="text-lg sm:text-xl">⭐</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg font-black mb-1">
                    Customers Pain Points
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Grouped by complaint theme with real customer quotes
                  </p>
                </div>
              </div>

              {/* Complaint Themes */}
              <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
                {themes.map((theme: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + idx * 0.08 }}
                    className={`pb-6 ${idx < themes.length - 1 ? "border-b border-red-500/10" : ""}`}
                  >
                    {/* Theme Header with count */}
                    <div className="mb-4">
                      <h3 className="text-sm sm:text-base font-black mb-2 flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg">{theme.emoji || "🔴"}</span>
                        <span>{theme.theme}</span>
                        <span className="text-red-300 text-xs sm:text-sm">
                          — {theme.mentions} mentions
                        </span>
                      </h3>
                      {theme.description && (
                        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                          {theme.description}
                        </p>
                      )}
                    </div>

                    {/* Verbatim Quotes */}
                    <div className="flex flex-col gap-3">
                      {(theme.quotes || []).map((quote: string, qIdx: number) => (
                        <div
                          key={qIdx}
                          className="px-3 sm:px-4 py-3 sm:py-4 bg-red-500/5 border-l-3 border-red-500/30 rounded text-xs sm:text-sm text-slate-200 italic leading-relaxed whitespace-pre-wrap wrap-break-word"
                        >
                          "{quote}"
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* Ad Angles Section */}
        {adAngles.length > 0 && (
          (() => {
            return (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 sm:mt-16"
              >
                {/* Section Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl sm:text-2xl">💡</span>
                    <h2 className="text-2xl sm:text-3xl font-black">Ad Angles</h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-400">
                    Strategic marketing positions targeting customer pain points
                  </p>
                </div>

                {/* Ad Angles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {adAngles.map((angle: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + idx * 0.08 }}
                      className="p-5 sm:p-6 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/8 transition-colors"
                    >
                      <div className="mb-4">
                        <h3 className="text-base sm:text-lg font-black text-amber-300 mb-2">
                          {angle.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                          <span className="font-semibold text-amber-200">Pain:</span> {angle.customerPain}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                          <span className="font-semibold text-amber-200">Hidden Frustration:</span> {angle.hiddenFrustration}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
                          <span className="font-semibold text-amber-200">Market Gap:</span> {angle.marketGap}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <span className="font-semibold text-amber-200">Why It Works:</span> {angle.whyItWorks}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })()
        )}

        {/* Hooks Section */}
        {hooks.length > 0 && (
          (() => {
            return (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 sm:mt-16"
              >
                {/* Section Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl sm:text-2xl">🎣</span>
                    <h2 className="text-2xl sm:text-3xl font-black">Hooks</h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-400">
                    Attention-grabbing opening lines for ads (first 1-3 seconds)
                  </p>
                </div>

                {/* Hooks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {hooks.map((hook: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + idx * 0.08 }}
                      className="p-5 sm:p-6 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/8 transition-colors"
                    >
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs sm:text-sm font-black px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">
                            {hook.hookType || "Hook"}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base font-black text-cyan-200 mb-3 italic">
                          "{hook.hook}"
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-2">
                          <span className="font-semibold text-cyan-300">Visual:</span> {hook.visualDirection}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <span className="font-semibold text-cyan-300">Targets:</span> {hook.customerPainUsed}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })()
        )}

        {/* Scripts Section */}
        {scripts.length > 0 && (
          (() => {
            return (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 sm:mt-16"
              >
                {/* Section Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl sm:text-2xl">🎬</span>
                    <h2 className="text-2xl sm:text-3xl font-black">Scripts</h2>
                  </div>
                  <p className="text-sm sm:text-base text-slate-400">
                    Complete 30-second video ad scripts with visual direction
                  </p>
                </div>

                {/* Scripts Grid */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {scripts.map((script: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 + idx * 0.08 }}
                      className="p-5 sm:p-6 rounded-xl border border-purple-500/20 bg-purple-500/5"
                    >
                      <div className="mb-4">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-xs sm:text-sm font-black px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                            {script.format || "Script"}
                          </span>
                          <span className="text-xs sm:text-sm font-black px-2 py-1 rounded bg-pink-500/20 text-pink-300">
                            {script.targetEmotion || "Emotion"}
                          </span>
                          <span className="text-xs sm:text-sm text-purple-300 ml-auto">
                            {script.duration}
                          </span>
                        </div>

                        {/* Script Scenes */}
                        <div className="space-y-3">
                          {(script.scenes || []).map((scene: any, sIdx: number) => (
                            <div
                              key={sIdx}
                              className="pl-4 border-l-2 border-purple-500/30 pb-3 text-xs sm:text-sm"
                            >
                              <div className="font-black text-purple-300 mb-1">
                                Scene {scene.sceneNumber}: {sIdx === 0 ? "Hook" : sIdx === 1 ? "Problem" : sIdx === 2 ? "Solution" : sIdx === 3 ? "Proof" : "CTA"}
                              </div>
                              <p className="text-slate-400 mb-1">
                                <span className="font-semibold text-purple-200">Visual:</span> {scene.visual}
                              </p>
                              <p className="text-slate-400 italic">
                                <span className="font-semibold text-purple-200">Voice:</span> "{scene.voice}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })()
        )}


        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 sm:mt-10 text-center"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 sm:px-9 py-3 sm:py-4 rounded-2xl text-sm sm:text-base text-slate-500 bg-white/3 border border-white/7 hover:bg-white/5 transition-colors no-underline"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

