import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ensureFreshSession, toClientSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = await ensureFreshSession(cookieStore, cookieStore);

  return NextResponse.json(toClientSession(session));
}
