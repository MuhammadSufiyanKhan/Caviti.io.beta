import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

const MAX_REPORT_BYTES = 400_000;

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Save a report to the signed-in user's dashboard. */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in to save reports.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const productName = typeof body?.product_name === 'string' ? body.product_name.trim() : '';
    const marketData = body?.market_data;

    if (!productName || productName.length > 200) {
      return NextResponse.json({ error: 'A valid product name is required.' }, { status: 400 });
    }
    if (!marketData || typeof marketData !== 'object' || typeof marketData.analysis !== 'string') {
      return NextResponse.json({ error: 'Report data is missing.' }, { status: 400 });
    }
    if (JSON.stringify(marketData).length > MAX_REPORT_BYTES) {
      return NextResponse.json({ error: 'This report is too large to save.' }, { status: 413 });
    }

    const { data, error } = await admin()
      .from('reports')
      .insert([{ user_id: user.id, product_name: productName, market_data: marketData }])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Failed to save report:', { userId: user.id, error });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('POST /api/reports error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await admin()
      .from('reports')
      .delete()
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Failed to delete all reports:', { userId: user.id, error });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedCount: data?.length ?? 0 });
  } catch (err: unknown) {
    console.error('DELETE /api/reports error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
