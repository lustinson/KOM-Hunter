import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensureFreshSession } from "@/lib/auth/session";
import { generateKomAnalysis } from "@/lib/analysis/kom-analysis-service";

export const runtime = "nodejs";

const analysisRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  riderWeightKg: z.number().positive().max(250),
  bikeWeightKg: z.number().positive().max(50),
  roadSurface: z.enum(["smooth", "average", "wet_average", "rough", "trail"]),
  lookbackDays: z.number().int().min(7).max(365),
  segmentLimit: z.number().int().min(1).max(20),
  maxActivities: z.number().int().min(1).max(50),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = await ensureFreshSession(cookieStore, cookieStore);

    if (!session) {
      return NextResponse.json(
        {
          message: "Connect your Strava account before running KOM analysis.",
        },
        { status: 401 },
      );
    }

    const payload = await request.json();
    const parsedRequest = analysisRequestSchema.parse(payload);
    const analysis = await generateKomAnalysis({ accessToken: session.accessToken }, parsedRequest);

    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid KOM analysis request.",
          issues: error.flatten(),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 },
    );
  }
}
