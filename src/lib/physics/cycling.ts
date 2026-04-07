import type { CapabilityStatus, RoadSurfaceKey } from "@/lib/types/domain";

export const DRAG_COEFFICIENT = 0.65;
export const FRONTAL_AREA_SQM = 0.36;
export const CDA = DRAG_COEFFICIENT * FRONTAL_AREA_SQM;
export const AIR_DENSITY = 1.19;
export const DRIVETRAIN_LOSS_MULTIPLIER = 1.02;

export const ROLLING_RESISTANCE_BY_SURFACE: Record<RoadSurfaceKey, number> = {
  smooth: 0.002,
  average: 0.004,
  wet_average: 0.0052,
  rough: 0.008,
  trail: 0.012,
};

export interface RequiredPowerInput {
  distanceMeters: number;
  durationSeconds: number;
  averageGradePercent: number;
  riderWeightKg: number;
  bikeWeightKg: number;
  effectiveHeadwindMps?: number;
  roadSurface?: RoadSurfaceKey;
}

export interface RequiredPowerResult {
  requiredPowerWatts: number;
  requiredSpeedKph: number;
  forceGravityNewtons: number;
  forceRollingNewtons: number;
  forceDragNewtons: number;
  totalResistanceNewtons: number;
}

export function stravaDurationToSeconds(durationLabel: string): number {
  if (durationLabel.endsWith("s")) {
    return Number.parseInt(durationLabel.replace("s", ""), 10);
  }

  const parts = durationLabel.split(":").map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Unsupported Strava duration label: ${durationLabel}`);
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  throw new Error(`Unsupported Strava duration label: ${durationLabel}`);
}

export function calculateRequiredPower(input: RequiredPowerInput): RequiredPowerResult {
  const speedMps = input.distanceMeters / input.durationSeconds;
  const weightKg = input.riderWeightKg + input.bikeWeightKg;
  const gradeRadians = Math.atan(input.averageGradePercent / 100);
  const rollingResistance = ROLLING_RESISTANCE_BY_SURFACE[input.roadSurface ?? "average"];
  const effectiveHeadwindMps = input.effectiveHeadwindMps ?? 0;

  const forceGravityNewtons = 9.81 * Math.sin(gradeRadians) * weightKg;
  const forceRollingNewtons = 9.8067 * Math.cos(gradeRadians) * weightKg * rollingResistance;
  const forceDragNewtons = 0.5 * CDA * AIR_DENSITY * (speedMps + effectiveHeadwindMps) ** 2;
  const totalResistanceNewtons = forceGravityNewtons + forceRollingNewtons + forceDragNewtons;
  const requiredPowerWatts = DRIVETRAIN_LOSS_MULTIPLIER * totalResistanceNewtons * speedMps;

  return {
    requiredPowerWatts: Math.round(requiredPowerWatts),
    requiredSpeedKph: Number((speedMps * 3.6).toFixed(1)),
    forceGravityNewtons,
    forceRollingNewtons,
    forceDragNewtons,
    totalResistanceNewtons,
  };
}

export function classifyCapability(requiredPowerWatts: number, riderPowerAtDurationWatts: number | null): CapabilityStatus {
  if (riderPowerAtDurationWatts === null) {
    return "unknown";
  }

  const ratio = riderPowerAtDurationWatts / requiredPowerWatts;

  if (ratio >= 1) {
    return "capable";
  }

  if (ratio >= 0.9) {
    return "stretch";
  }

  return "unlikely";
}
