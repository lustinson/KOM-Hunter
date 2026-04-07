import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  writeOauthStateCookie,
  writePostAuthRedirectCookie,
} from "@/lib/auth/session";
import { createOauthState, getStravaAuthorizeUrl } from "@/lib/strava/oauth";

export const runtime = "nodejs";

function sanitizeRedirect(redirectTo: string | null) {
  if (!redirectTo || !redirectTo.startsWith("/")) {
    return "/";
  }

  return redirectTo;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const requestUrl = new URL(request.url);
  const redirectTo = sanitizeRedirect(requestUrl.searchParams.get("redirectTo"));
  const state = createOauthState();

  writeOauthStateCookie(cookieStore, state);
  writePostAuthRedirectCookie(cookieStore, redirectTo);

  return NextResponse.redirect(getStravaAuthorizeUrl(state));
}
