import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { consumeOtp } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, otp } = await request.json();

    if (!email || !password || !firstName || !lastName || !otp) {
      return NextResponse.json({ error: "Please provide all details" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!consumeOtp(normalizedEmail, String(otp))) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    const adminSupabase = createServiceRoleClient();
    try {
      await adminSupabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
      });
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : String(createError);
      if (!message.toLowerCase().includes("already registered") && !message.toLowerCase().includes("already exists")) {
        throw createError;
      }
    }

    const supabase = await createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError || !signInData.session) {
      return NextResponse.json({ error: signInError?.message || "Unable to sign you in" }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: signInData.user });
  } catch (err: unknown) {
    console.error("Signup verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
