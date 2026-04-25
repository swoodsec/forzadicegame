import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, clearRateLimit } from "@/lib/rateLimit";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, remaining } = await checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { password } = body;
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Incorrect password", remaining },
      { status: 401 }
    );
  }

  await clearRateLimit(ip);
  const token = await signToken();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 12, // 12 hours
    path: "/",
  });
  return res;
}
