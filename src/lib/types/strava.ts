export interface StravaExploreSegment {
  id: number;
  name: string;
  distance: number;
  avg_grade: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
}

export interface StravaExploreResponse {
  segments: StravaExploreSegment[];
}

export interface StravaSegmentDetail {
  id: number;
  name: string;
  distance: number;
  average_grade: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
  xoms?: {
    kom?: string | null;
  };
}

export interface StravaActivitySummary {
  id: number;
  type: string;
  sport_type: string;
  start_date: string;
  device_watts?: boolean;
  average_watts?: number | null;
  max_watts?: number | null;
}

export interface StravaActivityStreamSeries<T = number | null> {
  type: string;
  data: T[];
}

export type StravaActivityStream = Array<StravaActivityStreamSeries<number | null>>;

export interface StravaRequestContext {
  accessToken: string;
}
