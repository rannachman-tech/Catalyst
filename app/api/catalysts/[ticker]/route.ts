import { NextRequest, NextResponse } from "next/server";
import { getTickerCatalysts } from "@/lib/catalyst-service";

export const revalidate = 1800; // 30 minutes

export async function GET(_req: NextRequest, ctx: { params: { ticker: string } }) {
  const set = await getTickerCatalysts(ctx.params.ticker);
  if (!set) {
    return NextResponse.json(
      { error: "Ticker not in supported universe." },
      { status: 404 }
    );
  }
  return NextResponse.json(set);
}
