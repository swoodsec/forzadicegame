"use client";

import { motion } from "framer-motion";
import CarCard from "./CarCard";
import TrackCard from "./TrackCard";
import type { Car, Track } from "@/types";

const DICE_FACES = [
  // ⚀ 1 dot
  <div key={1} className="flex items-center justify-center h-full"><span className="w-3 h-3 rounded-full bg-white" /></div>,
  // ⚁ 2 dots
  <div key={2} className="flex flex-col justify-between p-1 h-full">
    <span className="w-2.5 h-2.5 rounded-full bg-white self-end" />
    <span className="w-2.5 h-2.5 rounded-full bg-white self-start" />
  </div>,
  // ⚂ 3 dots
  <div key={3} className="flex flex-col justify-between p-1 h-full">
    <span className="w-2.5 h-2.5 rounded-full bg-white self-end" />
    <span className="w-2.5 h-2.5 rounded-full bg-white self-center" />
    <span className="w-2.5 h-2.5 rounded-full bg-white self-start" />
  </div>,
  // ⚃ 4 dots
  <div key={4} className="grid grid-cols-2 gap-1 p-1 h-full">
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
  </div>,
  // ⚄ 5 dots
  <div key={5} className="grid grid-cols-2 gap-1 p-1 h-full relative">
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white" />
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
    <span className="w-2.5 h-2.5 rounded-full bg-white" />
  </div>,
  // ⚅ 6 dots
  <div key={6} className="grid grid-cols-2 gap-1 p-1 h-full">
    {Array.from({ length: 6 }).map((_, i) => (
      <span key={i} className="w-2.5 h-2.5 rounded-full bg-white" />
    ))}
  </div>,
];

interface Props {
  cars: Car[];
  tracks: Track[];
  lastRoll: number | null;
}

export default function DiceGrid({ cars, tracks, lastRoll }: Props) {
  if (cars.length < 6 || tracks.length < 6) {
    return (
      <div className="text-center text-zinc-500 py-12">
        <p className="text-lg">No round configured yet.</p>
        {cars.length < 6 && (
          <p className="text-sm mt-1">Admin needs to configure a round first.</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Array.from({ length: 6 }, (_, i) => {
        const num = i + 1;
        const car = cars[i];
        const track = tracks[i];
        const isResult = lastRoll === num;

        return (
          <motion.div
            key={num}
            animate={isResult ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`rounded-xl border p-3 flex flex-col gap-2 transition-colors ${
              isResult
                ? "border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20"
                : "border-zinc-800 bg-zinc-900/60"
            }`}
          >
            {/* Dice face + number */}
            <div className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-lg flex-shrink-0 ${
                  isResult ? "bg-yellow-500" : "bg-zinc-700"
                }`}
              >
                {DICE_FACES[i]}
              </div>
              <span
                className={`text-lg font-bold ${isResult ? "text-yellow-400" : "text-zinc-400"}`}
              >
                {num}
              </span>
            </div>

            {/* Car */}
            <CarCard car={car} compact />

            {/* Track */}
            <TrackCard track={track} compact />
          </motion.div>
        );
      })}
    </div>
  );
}
