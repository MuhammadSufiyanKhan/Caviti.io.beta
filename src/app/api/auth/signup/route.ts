import { NextResponse } from "next/server";
import { createServiceRoleClient, ensureUserProfile } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Please provide all details" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const adminSupabase = createServiceRoleClient();

    const { data: createdUserData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    });

    if (createError) {
      const message = createError.message || String(createError);
      if (message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const createdUserId = createdUserData?.user?.id ?? null;
    if (createdUserId) {
      await ensureUserProfile(createdUserId, normalizedEmail, {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      });
    }

    return NextResponse.json({ success: true, userId: createdUserId });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
