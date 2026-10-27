import { NextRequest, NextResponse } from "next/server";
import { renderCoverSvg } from "@/lib/cover";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dynamic cover endpoint consumed by next/image.
 * Optimized: short cache headers + tiny SVG payload.
 */
export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim() || "Game";
  const svg = renderCoverSvg(title);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
