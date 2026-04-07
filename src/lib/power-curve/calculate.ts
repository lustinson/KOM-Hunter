import type { PowerCurve } from "@/lib/types/domain";

export const DEFAULT_POWER_CURVE_DURATIONS = [1, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 1800] as const;

export function createEmptyPowerCurve(durations: readonly number[]): PowerCurve {
  return Object.fromEntries(durations.map((duration) => [String(duration), 0]));
}

export function normalizePowerData(powerData: Array<number | null>): number[] {
  return powerData.map((value) => value ?? 0);
}

export function calculateBestAveragePower(powerData: Array<number | null>, durationSeconds: number): number {
  const normalizedData = normalizePowerData(powerData);

  if (durationSeconds <= 0 || normalizedData.length < durationSeconds) {
    return 0;
  }

  const prefixSums = new Array<number>(normalizedData.length + 1).fill(0);

  for (let index = 0; index < normalizedData.length; index += 1) {
    prefixSums[index + 1] = prefixSums[index] + normalizedData[index];
  }

  let maxAveragePower = 0;

  for (let startIndex = 0; startIndex <= normalizedData.length - durationSeconds; startIndex += 1) {
    const totalPower = prefixSums[startIndex + durationSeconds] - prefixSums[startIndex];
    const averagePower = totalPower / durationSeconds;

    if (averagePower > maxAveragePower) {
      maxAveragePower = averagePower;
    }
  }

  return Math.round(maxAveragePower);
}

export function calculatePowerCurveForStream(powerData: Array<number | null>, durations: readonly number[]): PowerCurve {
  const uniqueDurations = Array.from(new Set(durations)).sort((left, right) => left - right);
  const powerCurve = createEmptyPowerCurve(uniqueDurations);

  for (const duration of uniqueDurations) {
    powerCurve[String(duration)] = calculateBestAveragePower(powerData, duration);
  }

  return powerCurve;
}

export function mergePowerCurves(powerCurves: PowerCurve[]): PowerCurve {
  const merged: PowerCurve = {};

  for (const curve of powerCurves) {
    for (const [duration, watts] of Object.entries(curve)) {
      merged[duration] = Math.max(merged[duration] ?? 0, watts);
    }
  }

  return merged;
}
