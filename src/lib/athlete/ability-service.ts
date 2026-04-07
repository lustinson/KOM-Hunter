import { calculatePowerCurveForStream, createEmptyPowerCurve, mergePowerCurves } from "@/lib/power-curve/calculate";
import { getActivityStream, getRecentActivities } from "@/lib/strava/client";
import type { PowerCurve } from "@/lib/types/domain";
import type { StravaActivityStream, StravaActivitySummary, StravaRequestContext } from "@/lib/types/strava";

const SUPPORTED_ACTIVITY_TYPES = new Set(["Ride", "VirtualRide"]);

export interface BuildAthletePowerCurveOptions {
  lookbackDays: number;
  durations: readonly number[];
  maxActivities: number;
}

export interface BuildAthletePowerCurveResult {
  powerCurve: PowerCurve;
  activitiesConsidered: number;
  activitiesWithPower: number;
}

function shouldIncludeActivity(activity: StravaActivitySummary) {
  return (
    (SUPPORTED_ACTIVITY_TYPES.has(activity.type) || SUPPORTED_ACTIVITY_TYPES.has(activity.sport_type)) &&
    (activity.device_watts === true || typeof activity.average_watts === "number")
  );
}

function getWattsSeries(stream: StravaActivityStream) {
  return stream.find((series) => series.type === "watts")?.data ?? [];
}

export async function buildAthletePowerCurve(
  context: StravaRequestContext,
  options: BuildAthletePowerCurveOptions,
): Promise<BuildAthletePowerCurveResult> {
  const beforeEpochSeconds = Date.now() / 1000;
  const afterEpochSeconds = beforeEpochSeconds - options.lookbackDays * 24 * 60 * 60;

  const activities = await getRecentActivities(context, {
    beforeEpochSeconds,
    afterEpochSeconds,
    perPage: 100,
  });

  const eligibleActivities = activities.filter(shouldIncludeActivity).slice(0, options.maxActivities);
  const streamResults = await Promise.allSettled(
    eligibleActivities.map(async (activity) => ({
      activityId: activity.id,
      stream: await getActivityStream(context, activity.id),
    })),
  );

  const powerCurves: PowerCurve[] = [];
  let activitiesWithPower = 0;

  for (const streamResult of streamResults) {
    if (streamResult.status !== "fulfilled") {
      continue;
    }

    const wattsSeries = getWattsSeries(streamResult.value.stream);

    if (wattsSeries.length === 0) {
      continue;
    }

    powerCurves.push(calculatePowerCurveForStream(wattsSeries, options.durations));
    activitiesWithPower += 1;
  }

  return {
    powerCurve: powerCurves.length > 0 ? mergePowerCurves(powerCurves) : createEmptyPowerCurve(options.durations),
    activitiesConsidered: eligibleActivities.length,
    activitiesWithPower,
  };
}
