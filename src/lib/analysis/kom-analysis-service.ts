import { buildAthletePowerCurve } from "@/lib/athlete/ability-service";
import { DEFAULT_POWER_CURVE_DURATIONS } from "@/lib/power-curve/calculate";
import { stravaDurationToSeconds } from "@/lib/physics/cycling";
import { getNearbySegments, getSegmentById } from "@/lib/strava/client";
import { analyzeSegment } from "@/lib/segments/analyze-segment";
import type { AnalysisRequest, CapabilityStatus, KomAnalysisResponse, RiderProfile } from "@/lib/types/domain";
import type { StravaRequestContext, StravaSegmentDetail } from "@/lib/types/strava";
import type { WeatherSnapshot } from "@/lib/types/weather";
import { getCurrentWeather } from "@/lib/weather/client";

const MIN_REQUIRED_POWER_WATTS = 100;

const CAPABILITY_SORT_ORDER: Record<CapabilityStatus, number> = {
  capable: 0,
  stretch: 1,
  unlikely: 2,
  unknown: 3,
};

function toRiderProfile(request: AnalysisRequest): RiderProfile {
  return {
    riderWeightKg: request.riderWeightKg,
    bikeWeightKg: request.bikeWeightKg,
    roadSurface: request.roadSurface,
  };
}

function getUniqueKomDurations(segments: StravaSegmentDetail[]) {
  return Array.from(
    new Set(
      segments
        .map((segment) => segment.xoms?.kom)
        .filter((komTime): komTime is string => Boolean(komTime))
        .map((komTime) => stravaDurationToSeconds(komTime)),
    ),
  ).sort((left, right) => left - right);
}

export async function generateKomAnalysis(
  context: StravaRequestContext,
  request: AnalysisRequest,
): Promise<KomAnalysisResponse> {
  const riderProfile = toRiderProfile(request);
  const nearbySegments = await getNearbySegments(context, request.lat, request.lon);
  const shortlistedSegments = nearbySegments.segments.slice(0, request.segmentLimit);

  const segmentResults = await Promise.allSettled(shortlistedSegments.map((segment) => getSegmentById(context, segment.id)));
  const segmentDetails = segmentResults
    .filter((result): result is PromiseFulfilledResult<StravaSegmentDetail> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((segment) => Boolean(segment.xoms?.kom));

  const durations = Array.from(new Set([...DEFAULT_POWER_CURVE_DURATIONS, ...getUniqueKomDurations(segmentDetails)])).sort(
    (left, right) => left - right,
  );

  const powerCurveResult = await buildAthletePowerCurve(context, {
    lookbackDays: request.lookbackDays,
    durations,
    maxActivities: request.maxActivities,
  });

  const weatherResults = await Promise.allSettled(
    segmentDetails.map((segment) => getCurrentWeather(segment.start_latlng[0], segment.start_latlng[1])),
  );

  const analyses = segmentDetails
    .map((segment, index) => {
      const weatherResult = weatherResults[index];
      const weather: WeatherSnapshot =
        weatherResult?.status === "fulfilled"
          ? weatherResult.value
          : {
              windSpeedMps: 0,
              windDirectionDeg: null,
              temperatureC: null,
              summary: null,
            };

      return analyzeSegment({
        segment,
        riderProfile,
        powerCurve: powerCurveResult.powerCurve,
        weather,
      });
    })
    .filter((analysis): analysis is NonNullable<typeof analysis> => analysis !== null)
    .filter((analysis) => analysis.requiredPowerWatts >= MIN_REQUIRED_POWER_WATTS)
    .sort((left, right) => {
      const statusDifference = CAPABILITY_SORT_ORDER[left.capabilityStatus] - CAPABILITY_SORT_ORDER[right.capabilityStatus];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return left.requiredPowerWatts - right.requiredPowerWatts;
    });

  const notes: string[] = [];

  if (segmentDetails.length === 0) {
    notes.push("No nearby segments with a published KOM time were returned by Strava.");
  }

  if (powerCurveResult.activitiesWithPower === 0) {
    notes.push("No recent Strava rides with usable power streams were available, so capability is marked as unknown.");
  }

  return {
    generatedAt: new Date().toISOString(),
    location: {
      lat: request.lat,
      lon: request.lon,
    },
    riderProfile,
    lookbackDays: request.lookbackDays,
    segmentsAnalyzed: analyses.length,
    activitiesConsidered: powerCurveResult.activitiesConsidered,
    activitiesWithPower: powerCurveResult.activitiesWithPower,
    powerCurve: powerCurveResult.powerCurve,
    results: analyses,
    notes,
  };
}
