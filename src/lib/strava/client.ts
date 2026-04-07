import "server-only";

import type {
  StravaActivityStream,
  StravaActivitySummary,
  StravaExploreResponse,
  StravaRequestContext,
  StravaSegmentDetail,
} from "@/lib/types/strava";

const STRAVA_API_BASE_URL = "https://www.strava.com/api/v3";

async function stravaFetch<T>(context: StravaRequestContext, path: string): Promise<T> {
  const response = await fetch(`${STRAVA_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${context.accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Strava request failed (${response.status}) for ${path}`);
  }

  return (await response.json()) as T;
}

export async function getNearbySegments(context: StravaRequestContext, lat: number, lon: number, radiusDegrees = 0.1) {
  const bounds = [lat - radiusDegrees, lon - radiusDegrees, lat + radiusDegrees, lon + radiusDegrees].join(",");
  const params = new URLSearchParams({
    bounds,
    activity_type: "riding",
  });

  return stravaFetch<StravaExploreResponse>(context, `/segments/explore?${params.toString()}`);
}

export async function getSegmentById(context: StravaRequestContext, segmentId: number) {
  return stravaFetch<StravaSegmentDetail>(context, `/segments/${segmentId}`);
}

export interface GetRecentActivitiesOptions {
  beforeEpochSeconds: number;
  afterEpochSeconds: number;
  perPage?: number;
}

export async function getRecentActivities(context: StravaRequestContext, options: GetRecentActivitiesOptions) {
  const params = new URLSearchParams({
    before: String(Math.floor(options.beforeEpochSeconds)),
    after: String(Math.floor(options.afterEpochSeconds)),
    per_page: String(options.perPage ?? 100),
  });

  return stravaFetch<StravaActivitySummary[]>(context, `/athlete/activities?${params.toString()}`);
}

export async function getActivityStream(context: StravaRequestContext, activityId: number) {
  const params = new URLSearchParams({
    keys: "watts,time",
  });

  return stravaFetch<StravaActivityStream>(context, `/activities/${activityId}/streams?${params.toString()}`);
}
