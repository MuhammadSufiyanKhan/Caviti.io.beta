import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildAppUrl } from "@/lib/urls";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAppUrl("/auth/reset-password"),
    });

    if (error) {
      console.error("Password reset error:", error);
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (err: unknown) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
