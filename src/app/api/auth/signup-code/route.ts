import { NextResponse } from "next/server";
import { generateOtpCode, storeOtp } from "@/lib/otp";

function deliverOtpEmail(toEmail: string, otp: string, firstName?: string) {
  const deliveryId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fromAddress = "local-dev@caviti.test";

  console.log(`[OTP delivery] to=${toEmail}`);
  console.log(`[OTP delivery] code=${otp}`);
  console.log(`[OTP delivery] from=${fromAddress}`);
  console.log(`[OTP delivery] message=Hello ${firstName || "there"}, your verification code is ${otp}`);

  return { deliveryId, fromAddress };
}

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, password } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Please provide your full details" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otp = generateOtpCode();
    storeOtp(normalizedEmail, otp);

    const { deliveryId, fromAddress } = deliverOtpEmail(normalizedEmail, otp, firstName);

    return NextResponse.json({
      success: true,
      message: "A verification code has been prepared for your email.",
      sentTo: normalizedEmail,
      deliveryId,
      from: fromAddress,
      ...(process.env.NODE_ENV !== "production" ? { debugCode: otp } : {}),
    });
  } catch (err: unknown) {
    console.error("OTP email error:", err);
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
