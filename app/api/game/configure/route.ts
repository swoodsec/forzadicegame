import { NextRequest, NextResponse } from "next/server";
import { configureGame } from "@/lib/game";
import type { GameFilters } from "@/types";

const VALID_DRIVETRAINS = new Set(["AWD", "FWD", "RWD"]);

export async function POST(req: NextRequest) {
  let body: Partial<GameFilters>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { minPI, maxPI, drivetrains } = body;

  if (typeof minPI !== "number" || typeof maxPI !== "number") {
    return NextResponse.json({ error: "minPI and maxPI must be numbers" }, { status: 400 });
  }
  if (minPI < 100 || maxPI > 999 || minPI > maxPI) {
    return NextResponse.json({ error: "PI range must be 100–999 with min ≤ max" }, { status: 400 });
  }
  if (!Array.isArray(drivetrains) || drivetrains.length === 0) {
    return NextResponse.json({ error: "At least one drivetrain must be selected" }, { status: 400 });
  }
  if (!drivetrains.every((d) => VALID_DRIVETRAINS.has(d))) {
    return NextResponse.json({ error: "Invalid drivetrain value" }, { status: 400 });
  }

  try {
    const state = await configureGame({ minPI, maxPI, drivetrains });
    return NextResponse.json(state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Configure failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
