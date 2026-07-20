import { createClient } from "@/utils/supabase/server";

import { requireAdmin } from "../../admin-guard";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: "paid" | "pending" | "failed" }>;
}) {
  await requireAdmin();

  const supabase = await createClient();
  const { status } = await searchParams;

  let query = supabase
    .from("payments")
    .select(
      "id,user_id,plan_id,amount_cents,currency,status,payment_date"
    )
    .order("payment_date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query.limit(5000);
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">Payments & Invoices</h2>
        <p className="text-sm text-[#A1A1AA] mt-1">All payments across users</p>
      </div>

      <form method="get" className="flex flex-col sm:flex-row gap-3 items-end">
        <label className="text-sm text-[#A1A1AA]">Filter by status</label>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="w-full sm:w-60 rounded-lg border border-[#1F2937] bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[#3b82f6]/20 border border-[#3b82f6]/30 px-4 py-2 text-sm font-extrabold hover:bg-[#3b82f6]/25"
        >
          Apply
        </button>
      </form>

      <div className="rounded-xl border border-[#1F2937] bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F2937] text-[#A1A1AA]">
                <th className="text-left py-3 px-4">User Email</th>
                <th className="text-left py-3 px-4">Plan</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#A1A1AA]">
                    No payments found.
                  </td>
                </tr>
              ) : (
                rows.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#1F2937]/40">
                    <td className="py-3 px-4 text-[#E5E7EB]/80">{p.user_id}</td>
                    <td className="py-3 px-4">{p.plan_id ?? "—"}</td>
                    <td className="py-3 px-4 font-semibold">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: p.currency ?? "USD",
                        maximumFractionDigits: 0,
                      }).format((p.amount_cents ?? 0) / 100)}
                    </td>
                    <td className="py-3 px-4 text-[#E5E7EB]/80">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={
                          "inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide " +
                          (p.status === "paid"
                            ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]"
                            : p.status === "pending"
                              ? "border-[#fbbf24]/30 bg-[#fbbf24]/10 text-[#fbbf24]"
                              : "border-[#fb7185]/30 bg-[#fb7185]/10 text-[#fb7185]")
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#A1A1AA]">
        Note: currently shows user_id/plan_id. If you want user email + plan name, we’ll add joins (fetch profiles + plans).
      </p>
    </div>
  );
}

