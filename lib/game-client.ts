import type { Car, GameFilters } from "@/types";
import carsData from "@/data/cars.json";

export function filterCars(filters: GameFilters): Car[] {
  return (carsData as Car[]).filter(
    (car) =>
      car.pi >= filters.minPI &&
      car.pi <= filters.maxPI &&
      filters.drivetrains.includes(car.drivetrain)
  );
}
