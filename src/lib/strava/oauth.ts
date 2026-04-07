import "server-only";

import { randomBytes } from "node:crypto";

import { getServerEnv } from "@/lib/config/env";
import type { AuthenticatedAthlete, StravaSession } from "@/lib/types/auth";

const STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_SCOPES = ["read", "activity:read_all"];

interface StravaTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: AuthenticatedAthlete;
}

function mapTokenResponseToSession(tokenResponse: StravaTokenResponse): StravaSession {
  return {
    athlete: tokenResponse.athlete,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: tokenResponse.expires_at,
    scope: STRAVA_SCOPES.join(","),
    tokenType: tokenResponse.token_type,
  };
}

export function createOauthState() {
  return randomBytes(24).toString("hex");
}

export function getStravaAuthorizeUrl(state: string) {
  const { STRAVA_CLIENT_ID, STRAVA_REDIRECT_URI } = getServerEnv();
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPES.join(","),
    state,
  });

  return `${STRAVA_AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeToken(params: URLSearchParams) {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Strava token exchange failed (${response.status}).`);
  }

  return (await response.json()) as StravaTokenResponse;
}

export async function exchangeCodeForSession(code: string) {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = getServerEnv();
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
  });

  const tokenResponse = await exchangeToken(params);
  return mapTokenResponseToSession(tokenResponse);
}

export async function refreshStravaSession(refreshToken: string) {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = getServerEnv();
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const tokenResponse = await exchangeToken(params);
  return mapTokenResponseToSession(tokenResponse);
}
