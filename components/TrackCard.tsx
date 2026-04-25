"use client";

import type { Track } from "@/types";

interface Props {
  track: Track;
  compact?: boolean;
}

export default function TrackCard({ track, compact = false }: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-zinc-800/80 rounded-lg p-2 min-w-0">
        <div className="relative w-16 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-700">
          {track.thumbnailUrl ? (
            <img
              src={track.thumbnailUrl}
              alt={track.name}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
              🏁
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate text-zinc-100">{track.name}</p>
          <p className="text-xs text-zinc-400 truncate">{track.configuration}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 flex flex-col">
      <div className="relative w-full h-32 bg-zinc-800">
        {track.thumbnailUrl ? (
          <img
            src={track.thumbnailUrl}
            alt={track.name}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-600">
            🏁
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-0.5">
        <p className="text-sm font-bold text-zinc-100 leading-tight">{track.name}</p>
        <p className="text-xs text-zinc-400">{track.configuration}</p>
      </div>
    </div>
  );
}
