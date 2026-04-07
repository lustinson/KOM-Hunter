export type RoadSurfaceKey = "smooth" | "average" | "wet_average" | "rough" | "trail";

export type CapabilityStatus = "capable" | "stretch" | "unlikely" | "unknown";

export type PowerCurve = Record<string, number>;

export interface RiderProfile {
  riderWeightKg: number;
  bikeWeightKg: number;
  roadSurface: RoadSurfaceKey;
}

export interface AnalysisRequest {
  lat: number;
  lon: number;
  riderWeightKg: number;
  bikeWeightKg: number;
  roadSurface: RoadSurfaceKey;
  lookbackDays: number;
  segmentLimit: number;
  maxActivities: number;
}

export interface SegmentAnalysisResult {
  segmentId: number;
  segmentName: string;
  startLat: number;
  startLon: number;
  distanceMeters: number;
  averageGradePercent: number;
  komTimeLabel: string;
  komTimeSeconds: number;
  requiredSpeedKph: number;
  requiredPowerWatts: number;
  riderPowerAtDurationWatts: number | null;
  powerDeltaWatts: number | null;
  capabilityStatus: CapabilityStatus;
  weatherSummary: string | null;
  windSpeedMps: number;
  windDirectionDeg: number | null;
  temperatureC: number | null;
}

export interface KomAnalysisResponse {
  generatedAt: string;
  location: {
    lat: number;
    lon: number;
  };
  riderProfile: RiderProfile;
  lookbackDays: number;
  segmentsAnalyzed: number;
  activitiesConsidered: number;
  activitiesWithPower: number;
  powerCurve: PowerCurve;
  results: SegmentAnalysisResult[];
  notes: string[];
}
