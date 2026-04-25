import { NextResponse } from "next/server";
import { rollDice } from "@/lib/game";

export async function POST() {
  try {
    const state = await rollDice();
    return NextResponse.json(state);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Roll failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
