export type Drivetrain = "AWD" | "FWD" | "RWD";

export type CarClass = "D" | "C" | "B" | "A" | "S1" | "S2" | "X";

export interface Car {
  id: string;
  name: string;
  manufacturer: string;
  year: number;
  pi: number;
  class: CarClass;
  drivetrain: Drivetrain;
  thumbnailUrl: string;
}

export interface Track {
  id: string;
  name: string;
  configuration: string;
  thumbnailUrl: string;
}

export interface GameFilters {
  minPI: number;
  maxPI: number;
  drivetrains: Drivetrain[];
}

export interface GameState {
  stateVersion: number;
  filters: GameFilters;
  selectedCars: Car[];
  selectedTracks: Track[];
  lastRoll: number | null;
  rolledCar: Car | null;
  rolledTrack: Track | null;
}
