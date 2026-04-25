"use client";

import type { Car } from "@/types";

const DRIVETRAIN_COLORS: Record<string, string> = {
  AWD: "bg-blue-600",
  FWD: "bg-green-600",
  RWD: "bg-orange-600",
};

const CLASS_COLORS: Record<string, string> = {
  E: "bg-zinc-600",
  D: "bg-zinc-500",
  C: "bg-yellow-600",
  B: "bg-orange-600",
  A: "bg-red-600",
  S1: "bg-purple-600",
  S2: "bg-blue-600",
  X: "bg-pink-600",
};

interface Props {
  car: Car;
  compact?: boolean;
}

export default function CarCard({ car, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800/80 rounded-lg p-2 min-w-0">
        <div className="relative w-16 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-700">
          {car.thumbnailUrl ? (
            <img
              src={car.thumbnailUrl}
              alt={car.name}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
              🚗
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate text-zinc-100">{car.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-xs px-1 rounded font-bold text-white ${CLASS_COLORS[car.class] ?? "bg-zinc-600"}`}>
              {car.class} {car.pi}
            </span>
            <span className={`text-xs px-1 rounded font-bold text-white ${DRIVETRAIN_COLORS[car.drivetrain] ?? "bg-zinc-600"}`}>
              {car.drivetrain}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 flex flex-col">
      <div className="relative w-full h-32 bg-zinc-800">
        {car.thumbnailUrl ? (
          <img
            src={car.thumbnailUrl}
            alt={car.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-600">
            🚗
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-sm font-bold text-zinc-100 leading-tight">{car.name}</p>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-bold text-white ${CLASS_COLORS[car.class] ?? "bg-zinc-600"}`}>
            {car.class} {car.pi}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-bold text-white ${DRIVETRAIN_COLORS[car.drivetrain] ?? "bg-zinc-600"}`}>
            {car.drivetrain}
          </span>
        </div>
      </div>
    </div>
  );
}
