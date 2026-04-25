"use client";

import { useState } from "react";
import type { GameFilters, GameState } from "@/types";

interface Props {
  filters: GameFilters;
  onConfigure: (filters: GameFilters) => Promise<void>;
  onLogout: () => Promise<void>;
  carCount: number;
}

export default function AdminPanel({ filters, onConfigure, onLogout, carCount }: Props) {
  const [minPI, setMinPI] = useState(filters.minPI);
  const [maxPI, setMaxPI] = useState(filters.maxPI);
  const [drivetrains, setDrivetrains] = useState<string[]>(filters.drivetrains);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDrivetrain(dt: string) {
    setDrivetrains((prev) =>
      prev.includes(dt) ? prev.filter((d) => d !== dt) : [...prev, dt]
    );
  }

  async function handleConfigure() {
    if (drivetrains.length === 0) {
      setError("Select at least one drivetrain.");
      return;
    }
    if (minPI > maxPI) {
      setError("Min PI must be ≤ Max PI.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfigure({ minPI, maxPI, drivetrains: drivetrains as ("AWD" | "FWD" | "RWD")[] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Configuration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-zinc-100">Round Configuration</h2>
        <button
          onClick={onLogout}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* PI Range */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-zinc-300">PI Range</label>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-zinc-500">Min PI: <span className="text-zinc-300 font-mono">{minPI}</span></span>
            <input
              type="range"
              min={100}
              max={maxPI}
              value={minPI}
              onChange={(e) => setMinPI(Number(e.target.value))}
              className="w-full accent-yellow-500"
            />
          </div>
          <div className="text-zinc-600">–</div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs text-zinc-500">Max PI: <span className="text-zinc-300 font-mono">{maxPI}</span></span>
            <input
              type="range"
              min={minPI}
              max={999}
              value={maxPI}
              onChange={(e) => setMaxPI(Number(e.target.value))}
              className="w-full accent-yellow-500"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "E/D (100–399)", min: 100, max: 399 },
            { label: "C/B (400–599)", min: 400, max: 599 },
            { label: "A/S1 (600–799)", min: 600, max: 799 },
            { label: "S2/X (800–999)", min: 800, max: 999 },
            { label: "All", min: 100, max: 999 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => { setMinPI(preset.min); setMaxPI(preset.max); }}
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drivetrain Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-300">Drivetrain</label>
        <div className="flex gap-3">
          {(["AWD", "FWD", "RWD"] as const).map((dt) => {
            const colors = { AWD: "blue", FWD: "green", RWD: "orange" };
            const colorMap = {
              AWD: "border-blue-500 bg-blue-500/20 text-blue-300",
              FWD: "border-green-500 bg-green-500/20 text-green-300",
              RWD: "border-orange-500 bg-orange-500/20 text-orange-300",
            };
            const unchecked = "border-zinc-700 bg-zinc-800 text-zinc-400";
            const checked = drivetrains.includes(dt);
            return (
              <label key={dt} className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => toggleDrivetrain(dt)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked ? colorMap[dt] : unchecked}`}
                >
                  {checked && <span className="text-xs font-bold">✓</span>}
                </div>
                <span className={`text-sm font-semibold ${checked ? colorMap[dt].split(" ")[2] : "text-zinc-500"}`}>
                  {dt}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Car count preview */}
      <p className="text-xs text-zinc-500">
        ~{carCount} cars match current filters
        {carCount < 6 && <span className="text-red-400 ml-1">(need at least 6)</span>}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        onClick={handleConfigure}
        disabled={loading || carCount < 6}
        className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-bold rounded-xl transition-colors disabled:cursor-not-allowed"
      >
        {loading ? "Randomizing..." : "🎲 Randomize Cars & Tracks"}
      </button>
    </div>
  );
}
