"use client";

import { motion } from "framer-motion";
import type { Car, Track } from "@/types";

interface Props {
  roll: number;
  car: Car;
  track: Track;
}

const DRIVETRAIN_COLORS: Record<string, string> = {
  AWD: "bg-blue-600",
  FWD: "bg-green-600",
  RWD: "bg-orange-600",
};

export default function ResultBanner({ roll, car, track }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border-2 border-yellow-500 bg-zinc-900 overflow-hidden shadow-xl shadow-yellow-500/20"
    >
      <div className="bg-yellow-500 text-zinc-900 px-4 py-2 flex items-center gap-2">
        <span className="text-2xl">🎲</span>
        <span className="font-black text-xl tracking-wide">ROLLED A {roll}!</span>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
        {/* Car */}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Car</p>
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-zinc-800">
            {car.thumbnailUrl ? (
              <img
                src={car.thumbnailUrl}
                alt={car.name}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🚗</div>
            )}
          </div>
          <div>
            <p className="font-bold text-lg text-zinc-100">{car.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-yellow-400">{car.class} {car.pi} PI</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold text-white ${DRIVETRAIN_COLORS[car.drivetrain] ?? "bg-zinc-600"}`}>
                {car.drivetrain}
              </span>
            </div>
          </div>
        </div>

        {/* Track */}
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your Track</p>
          <div className="relative w-full h-48 rounded-xl overflow-hidden bg-zinc-800">
            {track.thumbnailUrl ? (
              <img
                src={track.thumbnailUrl}
                alt={track.name}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🏁</div>
            )}
          </div>
          <div>
            <p className="font-bold text-lg text-zinc-100">{track.name}</p>
            <p className="text-sm text-zinc-400 mt-0.5">{track.configuration}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
