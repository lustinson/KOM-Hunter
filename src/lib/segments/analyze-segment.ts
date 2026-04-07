import { calculateRequiredPower, classifyCapability, stravaDurationToSeconds } from "@/lib/physics/cycling";
import type { PowerCurve, RiderProfile, SegmentAnalysisResult } from "@/lib/types/domain";
import type { StravaSegmentDetail } from "@/lib/types/strava";
import type { WeatherSnapshot } from "@/lib/types/weather";

export interface AnalyzeSegmentOptions {
  segment: StravaSegmentDetail;
  riderProfile: RiderProfile;
  powerCurve: PowerCurve;
  weather: WeatherSnapshot;
}

export function analyzeSegment(options: AnalyzeSegmentOptions): SegmentAnalysisResult | null {
  const komTimeLabel = options.segment.xoms?.kom;

  if (!komTimeLabel) {
    return null;
  }

  const komTimeSeconds = stravaDurationToSeconds(komTimeLabel);
  const powerResult = calculateRequiredPower({
    distanceMeters: options.segment.distance,
    durationSeconds: komTimeSeconds,
    averageGradePercent: options.segment.average_grade,
    riderWeightKg: options.riderProfile.riderWeightKg,
    bikeWeightKg: options.riderProfile.bikeWeightKg,
    effectiveHeadwindMps: options.weather.windSpeedMps,
    roadSurface: options.riderProfile.roadSurface,
  });

  const riderPowerAtDurationWatts = options.powerCurve[String(komTimeSeconds)] || null;
  const capabilityStatus = classifyCapability(powerResult.requiredPowerWatts, riderPowerAtDurationWatts);

  return {
    segmentId: options.segment.id,
    segmentName: options.segment.name,
    startLat: options.segment.start_latlng[0],
    startLon: options.segment.start_latlng[1],
    distanceMeters: Math.round(options.segment.distance),
    averageGradePercent: Number(options.segment.average_grade.toFixed(1)),
    komTimeLabel,
    komTimeSeconds,
    requiredSpeedKph: powerResult.requiredSpeedKph,
    requiredPowerWatts: powerResult.requiredPowerWatts,
    riderPowerAtDurationWatts,
    powerDeltaWatts: riderPowerAtDurationWatts === null ? null : riderPowerAtDurationWatts - powerResult.requiredPowerWatts,
    capabilityStatus,
    weatherSummary: options.weather.summary,
    windSpeedMps: options.weather.windSpeedMps,
    windDirectionDeg: options.weather.windDirectionDeg,
    temperatureC: options.weather.temperatureC,
  };
}
