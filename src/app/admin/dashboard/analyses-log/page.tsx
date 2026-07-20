import { createClient } from "@/utils/supabase/server";

import { requireAdmin } from "../../admin-guard";

export const dynamic = "force-dynamic";

import AnalysesLogClient, {
  type AdminReportRow,
} from "./AnalysesLogClient";

export default async function AdminAnalysesLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; date?: string }>;
}) {
  await requireAdmin();

  const supabase = await createClient();
  const { q = "", date = "" } = await searchParams;

  const normalizedQ = q.trim();
  const normalizedDate = date.trim();

  const query = supabase
    .from("reports")
    .select("id,user_id,product_name,created_at")
    .order("created_at", { ascending: false });

  const { data } = await (normalizedQ
    ? query.or(`user_id.ilike.%${normalizedQ}%,product_name.ilike.%${normalizedQ}%`)
    : query);

  const rows = (Array.isArray(data) ? data : []) as AdminReportRow[];

  // Client will apply date filter UI; keep this for server-side narrowing if needed.
  return (
    <AnalysesLogClient
      initialQ={normalizedQ}
      initialDate={normalizedDate}
      rows={rows}
    />
  );
}

