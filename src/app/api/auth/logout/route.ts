import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  clearSessionCookie(cookieStore);

  return NextResponse.json({ success: true });
}
