import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.warn("Deprecated route /api/auth/signup was called. Use /api/auth/signup-code instead.");
  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Please send signup requests to /api/auth/signup-code.",
    },
    { status: 410 }
  );
}
