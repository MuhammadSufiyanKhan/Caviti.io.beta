"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Activity } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FREE_TRIAL_TOTAL = 5;

export default function BillingPage() {
  const [remainingTrials, setRemainingTrials] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState("free");
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("remaining_trials, subscription_status")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch profile:", error);
        return;
      }

      setRemainingTrials(data.remaining_trials);
      setSubscriptionStatus(data.subscription_status);
    }
    fetchProfile();
  }, [supabase]);

  const trialsUsed = Math.max(FREE_TRIAL_TOTAL - remainingTrials, 0);
  const usagePercent =
    subscriptionStatus === "free"
      ? Math.min((trialsUsed / FREE_TRIAL_TOTAL) * 100, 100)
      : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to dashboard
        </Link>
      </div>

      <div className="space-y-6">
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Current subscription</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-xl font-medium capitalize text-foreground">
                {subscriptionStatus === "free" ? "Free tier" : subscriptionStatus}
              </p>
              <p className="mt-1 text-sm text-muted">
                {subscriptionStatus === "free"
                  ? `${remainingTrials} of ${FREE_TRIAL_TOTAL} trials remaining`
                  : "Paid subscription active"}
              </p>
            </div>
            <Badge variant={subscriptionStatus === "free" ? "outline" : "default"}>
              {subscriptionStatus === "free" ? "Free" : "Active"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
            <CardDescription>Free trial consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted">
              <Activity className="h-4 w-4" strokeWidth={1.5} />
              <span>
                {trialsUsed} of {FREE_TRIAL_TOTAL} trials used
              </span>
              <span className="ml-auto font-medium text-foreground">
                {usagePercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            {remainingTrials === 0 && (
              <p className="mt-3 text-xs text-muted">
                You have used all of your free trials.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y divide-border">
            {[
              { id: "INV-2026-002", date: "June 1, 2026", amount: "$29.00" },
              { id: "INV-2026-001", date: "May 1, 2026", amount: "$29.00" },
            ].map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{invoice.id}</p>
                    <p className="text-xs text-muted">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-foreground">{invoice.amount}</span>
                  <Badge variant="success">Paid</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button variant="secondary" className="w-full sm:w-auto">
          Manage payment method
        </Button>
      </div>
    </main>
  );
}
