import { NextRequest, NextResponse } from "next/server";
import { getMultiCatalysts } from "@/lib/catalyst-service";

export async function POST(req: NextRequest) {
  const { tickers } = (await req.json().catch(() => ({}))) as { tickers?: string[] };
  if (!Array.isArray(tickers) || tickers.length === 0) {
    return NextResponse.json({ error: "Provide tickers: string[]" }, { status: 400 });
  }
  if (tickers.length > 25) {
    return NextResponse.json({ error: "Max 25 tickers per request." }, { status: 400 });
  }
  const sets = await getMultiCatalysts(tickers);
  return NextResponse.json({ sets });
}
