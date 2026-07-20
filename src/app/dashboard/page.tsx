"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Activity, BarChart3, Target, CheckCircle2, Trash2, ExternalLink, Search, ChevronRight, Loader2 } from "lucide-react";
import { AnalysisLoader } from "@/components/dashboard/AnalysisLoader";
import UserMenu from "@/components/UserMenu";
import type { Database } from "@/types/database.types";

type Report = Database["public"]["Tables"]["reports"]["Row"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [remainingTrials, setRemainingTrials] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();
  const supabase = createClient();

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

  const fetchDashboardData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [reportsResult, profileResult] = await Promise.all([
      supabase.from("reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("remaining_trials").eq("id", user.id).single(),
    ]);
    if (reportsResult.data) setReports(reportsResult.data);
    if (profileResult.data) setRemainingTrials(profileResult.data.remaining_trials ?? 0);
  }, [supabase]);

  const handleAnalyze = async () => {
    if (!url.trim()) { alert("Please enter a URL or product name."); return; }
    setLoading(true);
    setLoadingStep(0);
    stepTimerRef.current = setInterval(() => setLoadingStep((s) => Math.min(2, s + 1)), 2800);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const res = await fetch("/api/analyze-serpapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setLoadingStep(2);
        await fetchDashboardData();
        router.push(`/dashboard/report/${data.id}`);
      } else {
        alert("Error: " + (data.error || "Analysis failed"));
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Delete this report?")) return;
    setDeletingId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) { alert("Error: " + (body.error || "Failed")); return; }
      setReports(prev => prev.filter(r => r.id !== reportId));
      setRemainingTrials(prev => prev + 1);
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL reports?")) return;
    setDeletingId("all");
    try {
      const res = await fetch("/api/reports", { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) { alert("Error: " + (body.error || "Failed")); return; }
      setReports([]);
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  useEffect(() => {
    const run = async () => {
      await fetchDashboardData();
    };
    run();
  }, [fetchDashboardData]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E7EB] font-sans">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[#1F2937] bg-[#0A0A0A]/78 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/logo.png"
                alt="Caviti Logo"
                width={20}
                height={20}
                className="rounded-full flex-shrink-0"
              />
              <span className="text-white font-bold text-lg sm:text-xl truncate">caviti</span>
            </div>
            <span className="hidden sm:inline text-[#333]">/</span>
            <span className="hidden sm:inline text-xs sm:text-sm text-[#A1A1AA] bg-[#111] border border-[#1F2937] px-3 py-1 rounded-lg truncate">Dashboard</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 sm:gap-8 text-sm">
            <Link href="/dashboard" className="text-[#E5E7EB] font-semibold hover:text-white transition">Overview</Link>
            <Link href="/dashboard/billing" className="text-[#A1A1AA] hover:text-[#E5E7EB] transition">Billing</Link>
            <Link href="/" className="text-[#A1A1AA] hover:text-[#E5E7EB] transition">Home</Link>
          </div>
          <div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative z-10">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {[
            { title: "Trials Remaining", value: String(remainingTrials), icon: Activity, color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
            { title: "Total Reports", value: String(reports.length), icon: BarChart3, color: "#8b5cf6", glow: "rgba(139,92,246,0.15)" },
            { title: "Gaps Identified", value: reports.length > 0 ? `${reports.length * 5}+` : "—", icon: Target, color: "#10b981", glow: "rgba(16,185,129,0.15)" },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -3, scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}
              className="bg-[#111]/60 border border-[#1F2937] rounded-lg sm:rounded-xl p-4 sm:p-6 backdrop-blur-xl hover:border-[#333] transition">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border flex items-center justify-center flex-shrink-0" style={{ background: stat.glow, borderColor: `${stat.color}40` }}>
                  <stat.icon size={24} color={stat.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-[#475569] font-medium">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1 truncate">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#111]/60 border border-[#1F2937] rounded-lg sm:rounded-2xl p-4 sm:p-8 mb-8 backdrop-blur-xl hover:border-[#333] transition">
          <div className="mb-6">
            <h2 className="text-lg sm:text-2xl font-bold mb-2">Analyze Competitor or Product</h2>
            <p className="text-sm sm:text-base text-[#475569]">Enter a product name or competitor URL to get real market insights</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
              <input
                type="text"
                placeholder="https://competitor.com or product name..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-[#0A0A0A] border border-[#1F2937] rounded-lg focus:border-blue-500/40 focus:outline-none text-sm sm:text-base text-white placeholder-[#475569] disabled:opacity-50 transition"
              />
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading || remainingTrials === 0}
              className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base flex items-center justify-center sm:justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition text-white"
              style={{ background: loading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6, #6366f1)", boxShadow: "0 0 30px rgba(59,130,246,0.25)" }}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <span>Run Analysis</span>
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
          {loading && <AnalysisLoader activeStep={loadingStep} />}
          {remainingTrials === 0 && !loading && (
            <p className="mt-4 text-sm text-red-500">
              No trials remaining. <Link href="/dashboard/billing" className="text-blue-400 hover:text-blue-300 font-semibold">Upgrade →</Link>
            </p>
          )}
        </motion.div>

        {/* Reports Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#111]/60 border border-[#1F2937] rounded-lg sm:rounded-2xl overflow-hidden backdrop-blur-xl hover:border-[#333] transition">
          <div className="p-4 sm:p-6 border-b border-[#1F2937] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Recent Reports</h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">{reports.length} total analyses</p>
            </div>
            {reports.length > 0 && (
              <button onClick={handleDeleteAll} disabled={deletingId === "all"}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-red-500/20 transition disabled:opacity-50">
                <Trash2 size={16} />
                {deletingId === "all" ? "Deleting..." : "Delete All"}
              </button>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="py-16 sm:py-20 px-4 text-center">
              <BarChart3 size={40} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm sm:text-base text-[#334155]">No reports yet. Analyze your first product above.</p>
            </div>
          ) : (
            <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1F2937]">
                    {["Project", "Status", "Date", "Action"].map((h, i) => (
                      <th key={i} className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-[#334155] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, idx) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const data = report.market_data as any;
                    return (
                      <motion.tr key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                        className="border-b border-[#0F1419] hover:bg-[#111]/40 transition">
                        <td className="px-4 sm:px-6 py-4">
                          <p className="text-xs sm:text-sm font-semibold truncate capitalize">{report.product_name}</p>
                          {data?.url && (
                            <p className="text-xs text-[#334155] flex items-center gap-2 mt-1 truncate">
                              <ExternalLink size={12} className="flex-shrink-0" />
                              <span className="truncate">{data.url.replace(/^https?:\/\//, "").slice(0, 40)}</span>
                            </p>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 px-2 sm:px-3 py-1 rounded-full text-xs">
                            <CheckCircle2 size={12} /> Complete
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-[#334155]">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/report/${report.id}`} className="text-xs sm:text-sm bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 sm:px-3 py-1 rounded-lg hover:bg-blue-500/20 transition">
                              View →
                            </Link>
                            <button onClick={() => handleDelete(report.id)} disabled={deletingId === report.id}
                              className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 p-1 sm:p-2 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list view */}
            <div className="sm:hidden px-4 py-3 space-y-3">
              {reports.map((report, idx) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data = report.market_data as any;
                return (
                  <motion.div key={report.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                    className="bg-[#0B0B0B] border border-[#1F2937] rounded-lg p-3 flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate capitalize">{report.product_name}</p>
                      {data?.url && (
                        <p className="text-xs text-[#334155] flex items-center gap-2 mt-1 truncate">
                          <ExternalLink size={12} className="flex-shrink-0" />
                          <span className="truncate">{data.url.replace(/^https?:\/\//, "").slice(0, 60)}</span>
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-green-500/10 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full text-[11px]">
                          <CheckCircle2 size={12} /> Complete
                        </span>
                        <span className="text-xs text-[#334155]">{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/report/${report.id}`} className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/20 transition">View →</Link>
                      <button onClick={() => handleDelete(report.id)} disabled={deletingId === report.id}
                        className="text-xs bg-red-500/10 border border-red-500/30 text-red-400 p-1 rounded-lg hover:bg-red-500/20 transition disabled:opacity-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}