import "server-only";

import { getServerEnv } from "@/lib/config/env";
import type { OpenWeatherCurrentResponse, WeatherSnapshot } from "@/lib/types/weather";

const OPEN_WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  const { OPENWEATHER_API_KEY } = getServerEnv();
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: OPENWEATHER_API_KEY,
    units: "metric",
  });

  const response = await fetch(`${OPEN_WEATHER_BASE_URL}?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }

  const weather = (await response.json()) as OpenWeatherCurrentResponse;

  return {
    windSpeedMps: weather.wind?.speed ?? 0,
    windDirectionDeg: weather.wind?.deg ?? null,
    temperatureC: weather.main?.temp ?? null,
    summary: weather.weather?.[0]?.description ?? null,
  };
}
