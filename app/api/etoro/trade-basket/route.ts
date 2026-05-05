import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TradeRow {
  ticker: string;
  amount: number;
  instrumentId: number;
}

const BASE = "https://public-api.etoro.com/api/v1";

function rid() {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? (crypto as { randomUUID: () => string }).randomUUID()
    : Math.random().toString(36).slice(2);
}

export async function POST(req: NextRequest) {
  const { apiKey, userKey, env, basket } = (await req
    .json()
    .catch(() => ({}))) as {
    apiKey?: string;
    userKey?: string;
    env?: "real" | "demo";
    basket?: TradeRow[];
  };

  if (!apiKey || !userKey || !env || !Array.isArray(basket) || basket.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing fields." }, { status: 400 });
  }

  const path =
    env === "demo"
      ? `${BASE}/trading/execution/demo/market-open-orders/by-amount`
      : `${BASE}/trading/execution/market-open-orders/by-amount`;

  const results: Array<{
    ticker: string;
    instrumentId: number;
    amount: number;
    ok: boolean;
    error?: string;
    positionId?: number;
  }> = [];

  for (const row of basket) {
    if (!row.amount || row.amount <= 0 || !row.instrumentId) {
      results.push({ ...row, ok: false, error: "Invalid row." });
      continue;
    }
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "x-user-key": userKey,
          "x-request-id": rid(),
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          InstrumentID: row.instrumentId,
          IsBuy: true,
          Leverage: 1,
          Amount: row.amount,
        }),
      });
      const txt = await res.text();
      if (!res.ok) {
        results.push({
          ...row,
          ok: false,
          error: `${res.status}: ${txt.slice(0, 160)}`,
        });
        continue;
      }
      let positionId: number | undefined;
      try {
        const j = JSON.parse(txt) as { PositionID?: number; positionId?: number };
        positionId = j.PositionID ?? j.positionId;
      } catch {
        // ignore parse failures — eToro sometimes returns empty body on success
      }
      results.push({ ...row, ok: true, positionId });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error.";
      results.push({ ...row, ok: false, error: msg });
    }
  }

  return NextResponse.json({ ok: results.every((r) => r.ok), results });
}
