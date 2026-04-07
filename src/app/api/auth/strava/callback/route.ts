import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  clearOauthStateCookie,
  clearPostAuthRedirectCookie,
  readOauthStateCookie,
  readPostAuthRedirectCookie,
  writeSessionCookie,
} from "@/lib/auth/session";
import { exchangeCodeForSession } from "@/lib/strava/oauth";

export const runtime = "nodejs";

function createRedirectUrl(request: Request, pathname: string, error?: string) {
  const url = new URL(pathname, request.url);

  if (error) {
    url.searchParams.set("authError", error);
  }

  return url;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");
  const state = requestUrl.searchParams.get("state");
  const expectedState = readOauthStateCookie(cookieStore);
  const redirectTo = readPostAuthRedirectCookie(cookieStore) ?? "/";

  clearOauthStateCookie(cookieStore);
  clearPostAuthRedirectCookie(cookieStore);

  if (providerError) {
    return NextResponse.redirect(createRedirectUrl(request, redirectTo, providerError));
  }

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(createRedirectUrl(request, redirectTo, "oauth_state_mismatch"));
  }

  try {
    const session = await exchangeCodeForSession(code);
    await writeSessionCookie(cookieStore, session);
    return NextResponse.redirect(createRedirectUrl(request, redirectTo));
  } catch (error) {
    console.error("Strava OAuth callback failed", error);
    return NextResponse.redirect(createRedirectUrl(request, redirectTo, "oauth_exchange_failed"));
  }
}
