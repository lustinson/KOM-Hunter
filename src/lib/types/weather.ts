export interface OpenWeatherCurrentResponse {
  wind?: {
    speed?: number;
    deg?: number;
  };
  main?: {
    temp?: number;
  };
  weather?: Array<{
    description?: string;
  }>;
}

export interface WeatherSnapshot {
  windSpeedMps: number;
  windDirectionDeg: number | null;
  temperatureC: number | null;
  summary: string | null;
}
