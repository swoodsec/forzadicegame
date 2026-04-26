"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdminPanel from "@/components/AdminPanel";
import DiceGrid from "@/components/DiceGrid";
import DiceRoller from "@/components/DiceRoller";
import ResultBanner from "@/components/ResultBanner";
import LoginModal from "@/components/LoginModal";
import { filterCars } from "@/lib/game-client";
import type { GameFilters, GameState } from "@/types";

const POLL_INTERVAL = 2000;

type AuthState = "checking" | "unauthenticated" | "authenticated";

export default function AdminView() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showResult, setShowResult] = useState(false);
  const lastRollRef = useRef<number | null>(null);

  // Check current auth status on mount
  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth/check");
      setAuthState(res.ok ? "authenticated" : "unauthenticated");
    }
    checkAuth();
  }, []);

  // Poll game state only when authenticated
  useEffect(() => {
    if (authState !== "authenticated") return;

    async function fetchState() {
      const res = await fetch("/api/game/state");
      if (res.status === 401) {
        setAuthState("unauthenticated");
        return;
      }
      if (res.ok) {
        const data: GameState = await res.json();
        setGameState(data);
        if (data.lastRoll !== null && data.lastRoll !== lastRollRef.current) {
          lastRollRef.current = data.lastRoll;
          setShowResult(false);
          setTimeout(() => setShowResult(true), 100);
        }
      }
    }

    fetchState();
    const id = setInterval(fetchState, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [authState]);

  async function handleLoginSuccess() {
    setAuthState("authenticated");
  }

  async function handleConfigure(filters: GameFilters) {
    const res = await fetch("/api/game/configure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Configuration failed");
    }
    const data: GameState = await res.json();
    setGameState(data);
    setShowResult(false);
  }

  async function handleRoll() {
    const res = await fetch("/api/game/roll", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Roll failed");
    }
    const data: GameState = await res.json();
    setGameState(data);
    if (data.lastRoll !== null) {
      lastRollRef.current = data.lastRoll;
      setShowResult(false);
      setTimeout(() => setShowResult(true), 1600);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthState("unauthenticated");
    setGameState(null);
    setShowResult(false);
  }

  // Loading / checking auth
  if (authState === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950">
        <p className="text-zinc-600">Loading...</p>
      </main>
    );
  }

  // Not authenticated — show login modal
  if (authState === "unauthenticated") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 gap-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🎲</span>
          <div>
            <h1 className="font-black text-2xl text-zinc-100">ForzaDice</h1>
            <p className="text-sm text-zinc-500">Admin Access</p>
          </div>
        </div>
        <LoginModal onSuccess={handleLoginSuccess} />
        <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
          ← Back to Player View
        </Link>
      </main>
    );
  }

  // Authenticated — show admin controls
  const hasRound = gameState && gameState.selectedCars.length === 6 && gameState.selectedTracks.length === 6;
  const carCount = gameState ? filterCars(gameState.filters).length : 0;

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎲</span>
            <div>
              <h1 className="font-black text-zinc-100 leading-none">ForzaDice</h1>
              <p className="text-xs text-yellow-500 font-semibold">Admin Mode</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            ← Player View
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {!gameState ? (
          <div className="text-center text-zinc-600 py-16">Loading game state...</div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <AdminPanel
                filters={gameState.filters}
                onConfigure={handleConfigure}
                onLogout={handleLogout}
                carCount={carCount}
              />
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 flex flex-col items-center justify-center gap-4">
                <h2 className="font-bold text-zinc-100 self-start">Roll the Dice</h2>
                {!hasRound ? (
                  <p className="text-sm text-zinc-500 text-center">
                    Configure a round first, then roll.
                  </p>
                ) : (
                  <DiceRoller onRoll={handleRoll} disabled={!hasRound} />
                )}
              </div>
            </div>

            {showResult && gameState.lastRoll && gameState.rolledCar && gameState.rolledTrack && (
              <ResultBanner
                roll={gameState.lastRoll}
                car={gameState.rolledCar}
                track={gameState.rolledTrack}
              />
            )}

            <DiceGrid
              cars={gameState.selectedCars}
              tracks={gameState.selectedTracks}
            />
          </>
        )}
      </div>
    </main>
  );
}
