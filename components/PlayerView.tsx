"use client";

import { useEffect, useRef, useState } from "react";
import DiceGrid from "./DiceGrid";
import ResultBanner from "./ResultBanner";
import type { GameState } from "@/types";

const POLL_INTERVAL = 1500;

export default function PlayerView() {
  const [state, setState] = useState<GameState | null>(null);
  const [showResult, setShowResult] = useState(false);
  const lastVersionRef = useRef<number>(-1);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/game/state");
        if (!res.ok) return;
        const data: GameState = await res.json();

        if (!cancelled) {
          if (data.stateVersion !== lastVersionRef.current) {
            lastVersionRef.current = data.stateVersion;
            // If a new roll happened, trigger result reveal
            if (data.lastRoll !== null && state?.lastRoll !== data.lastRoll) {
              setShowResult(false);
              setTimeout(() => setShowResult(true), 50);
            }
            setState(data);
          }
        }
      } catch {
        // silently ignore poll errors
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRound = state && state.selectedCars.length === 6 && state.selectedTracks.length === 6;

  return (
    <div className="flex flex-col gap-6">
      {/* Live result banner */}
      {showResult && state?.lastRoll && state.rolledCar && state.rolledTrack && (
        <ResultBanner
          roll={state.lastRoll}
          car={state.rolledCar}
          track={state.rolledTrack}
        />
      )}

      {/* Dice grid */}
      {state ? (
        <DiceGrid
          cars={state.selectedCars}
          tracks={state.selectedTracks}
          lastRoll={state.lastRoll}
        />
      ) : (
        <div className="text-center text-zinc-600 py-16">
          <p className="text-2xl mb-2">🎲</p>
          <p>Connecting...</p>
        </div>
      )}

      {!hasRound && state && (
        <p className="text-center text-sm text-zinc-600">
          Waiting for the admin to configure a round...
        </p>
      )}
    </div>
  );
}
