import { getRedis } from "./redis";
import type { Car, GameFilters, GameState, Track } from "@/types";
import cars from "@/data/cars.json";
import tracks from "@/data/tracks.json";

const GAME_KEY = "game:state";

const DEFAULT_STATE: GameState = {
  stateVersion: 0,
  filters: { minPI: 100, maxPI: 999, drivetrains: ["AWD", "FWD", "RWD"] },
  selectedCars: [],
  selectedTracks: [],
  lastRoll: null,
  rolledCar: null,
  rolledTrack: null,
};

export async function getGameState(): Promise<GameState> {
  const redis = getRedis();
  const raw = await redis.get<GameState>(GAME_KEY);
  if (!raw) return DEFAULT_STATE;

  // Re-hydrate stored car/track objects from current JSON so stale fields (e.g. thumbnailUrl) are always fresh.
  // Look up cars by id (stable), tracks by name+configuration (more stable than generated ids).
  const carMap = new Map((cars as Car[]).map((c) => [c.id, c]));
  const trackKey = (t: { name: string; configuration: string }) => `${t.name}||${t.configuration}`;
  const trackMap = new Map((tracks as Track[]).map((t) => [trackKey(t), t]));

  const hydrateTrack = (t: Track): Track => trackMap.get(trackKey(t)) ?? t;

  return {
    ...raw,
    selectedCars: raw.selectedCars.map((c) => carMap.get(c.id) ?? c),
    selectedTracks: raw.selectedTracks.map(hydrateTrack),
    rolledCar: raw.rolledCar ? (carMap.get(raw.rolledCar.id) ?? raw.rolledCar) : null,
    rolledTrack: raw.rolledTrack ? hydrateTrack(raw.rolledTrack) : null,
  };
}

export async function saveGameState(state: GameState): Promise<void> {
  const redis = getRedis();
  await redis.set(GAME_KEY, state);
}

export function filterCars(filters: GameFilters): Car[] {
  return (cars as Car[]).filter(
    (car) =>
      car.pi >= filters.minPI &&
      car.pi <= filters.maxPI &&
      filters.drivetrains.includes(car.drivetrain)
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom<T>(pool: T[], count: number): T[] {
  return shuffle(pool).slice(0, count);
}

export async function configureGame(filters: GameFilters): Promise<GameState> {
  const carPool = filterCars(filters);
  const trackPool = tracks as Track[];

  if (carPool.length < 6) {
    throw new Error(`Only ${carPool.length} cars match the filters — need at least 6`);
  }
  if (trackPool.length < 6) {
    throw new Error("Not enough tracks available");
  }

  const state = await getGameState();
  const newState: GameState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    filters,
    selectedCars: pickRandom(carPool, 6),
    selectedTracks: pickRandom(trackPool, 6),
    lastRoll: null,
    rolledCar: null,
    rolledTrack: null,
  };

  await saveGameState(newState);
  return newState;
}

export async function rollDice(): Promise<GameState> {
  const state = await getGameState();

  if (state.selectedCars.length < 6 || state.selectedTracks.length < 6) {
    throw new Error("No cars/tracks configured — configure the game first");
  }

  const roll = Math.floor(Math.random() * 6) + 1;
  const idx = roll - 1;

  const rolledCar = state.selectedCars[idx];
  const rolledTrack = state.selectedTracks[idx];

  // Replace the rolled slot with a fresh car/track so it can't repeat
  const usedCarIds = new Set(state.selectedCars.map((c) => c.id));
  const usedTrackIds = new Set(state.selectedTracks.map((t) => t.id));

  const carPool = filterCars(state.filters).filter((c) => !usedCarIds.has(c.id));
  const trackPool = (tracks as Track[]).filter((t) => !usedTrackIds.has(t.id));

  const updatedCars = [...state.selectedCars];
  const updatedTracks = [...state.selectedTracks];

  if (carPool.length > 0) {
    updatedCars[idx] = carPool[Math.floor(Math.random() * carPool.length)];
  }
  if (trackPool.length > 0) {
    updatedTracks[idx] = trackPool[Math.floor(Math.random() * trackPool.length)];
  }

  const newState: GameState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    lastRoll: roll,
    rolledCar,
    rolledTrack,
    selectedCars: updatedCars,
    selectedTracks: updatedTracks,
  };

  await saveGameState(newState);
  return newState;
}
