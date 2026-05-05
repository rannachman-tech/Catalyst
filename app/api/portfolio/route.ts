import { NextRequest, NextResponse } from "next/server";
import { getMultiCatalysts } from "@/lib/catalyst-service";
import { resolveTicker } from "@/lib/universe";

const MAX_TICKERS = 200;

export async function POST(req: NextRequest) {
  const { tickers } = (await req.json().catch(() => ({}))) as { tickers?: string[] };
  if (!Array.isArray(tickers) || tickers.length === 0) {
    return NextResponse.json({ error: "Provide tickers: string[]" }, { status: 400 });
  }
  if (tickers.length > MAX_TICKERS) {
    return NextResponse.json(
      { error: "Max " + MAX_TICKERS + " tickers per request." },
      { status: 400 }
    );
  }

  const supported: string[] = [];
  const unsupported: string[] = [];
  for (const t of tickers) {
    if (resolveTicker(t)) supported.push(t);
    else unsupported.push(t);
  }

  const sets: Awaited<ReturnType<typeof getMultiCatalysts>> = [];
  for (let i = 0; i < supported.length; i += 20) {
    const batch = supported.slice(i, i + 20);
    const out = await getMultiCatalysts(batch);
    sets.push(...out);
  }

  return NextResponse.json({ sets, unsupported });
}
