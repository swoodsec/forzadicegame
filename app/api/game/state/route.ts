import { NextResponse } from "next/server";
import { getGameState } from "@/lib/game";

export async function GET() {
  try {
    const state = await getGameState();
    return NextResponse.json(state);
  } catch (err) {
    console.error("Failed to get game state:", err);
    return NextResponse.json({ error: "Failed to get state" }, { status: 500 });
  }
}
