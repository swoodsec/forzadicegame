import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_API = ["/api/game/roll", "/api/game/configure", "/api/auth/logout"];

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return new TextEncoder().encode(secret);
}

async function isValidSession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p));

  if (!isProtectedApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get("fd_session")?.value;
  if (!token || !(await isValidSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/game/roll", "/api/game/configure", "/api/auth/logout"],
};
