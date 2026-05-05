// Reads the connected user's live eToro portfolio.
// Tries both /trading/info/portfolio and /trading/info/demo/portfolio,
// returns positions from whichever returns a non-empty list.
// Surfaces full debug info in the response when nothing is found, so we
// can diagnose response-shape issues from the UI.

import { NextRequest, NextResponse } from "next/server";
import { findByInstrumentId } from "@/lib/universe";

const BASE = "https://public-api.etoro.com/api/v1";

function rid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as { randomUUID: () => string }).randomUUID()
    : Math.random().toString(36).slice(2);
}

interface RawPosition {
  InstrumentID?: number;
  instrumentId?: number;
  InstrumentId?: number;
  Direction?: number;
  IsBuy?: boolean;
  Amount?: number;
  OpenAmount?: number;
  amount?: number;
  // Some responses nest position dollar amount under different keys
  Units?: number;
  TotalInvested?: number;
}

interface PositionView {
  ticker: string;
  symbolFull: string;
  instrumentId: number;
  name: string;
  amount: number;
  isBuy: boolean;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    apiKey?: string;
    userKey?: string;
    env?: "real" | "demo";
  };
  const { apiKey, userKey, env } = body;
  if (!apiKey || !userKey || !env) {
    return NextResponse.json(
      { ok: false, error: "Missing apiKey / userKey / env." },
      { status: 400 }
    );
  }

  // Try paths in priority order based on detected env, but always try BOTH
  // so we tolerate paths that 200 with the wrong list shape.
  const tries =
    env === "demo"
      ? [`${BASE}/trading/info/demo/portfolio`, `${BASE}/trading/info/portfolio`]
      : [`${BASE}/trading/info/portfolio`, `${BASE}/trading/info/demo/portfolio`];

  const debug: Array<{ path: string; status?: number; error?: string; rawCount?: number; topKeys?: string[] }> = [];

  for (const path of tries) {
    try {
      const res = await fetch(path, {
        headers: {
          "x-api-key": apiKey,
          "x-user-key": userKey,
          "x-request-id": rid(),
          accept: "application/json",
        },
      });
      const status = res.status;
      const txt = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(txt);
      } catch {
        debug.push({ path, status, error: "non-JSON response" });
        continue;
      }
      const containers = collectPositions(data);
      const topKeys = Object.keys(data ?? {}).slice(0, 10);
      debug.push({ path, status, rawCount: containers.length, topKeys });

      if (!res.ok) continue;

      // Aggregate by instrumentId
      const byId = new Map<
        number,
        { instrumentId: number; amount: number; longDollars: number; shortDollars: number }
      >();
      for (const p of containers) {
        const id = p.InstrumentID ?? p.instrumentId ?? p.InstrumentId;
        if (!id) continue;
        const isBuy =
          typeof p.IsBuy === "boolean"
            ? p.IsBuy
            : typeof p.Direction === "number"
            ? p.Direction === 1
            : true;
        const amt = p.OpenAmount ?? p.Amount ?? p.amount ?? p.TotalInvested ?? 0;
        const cur = byId.get(id) ?? {
          instrumentId: id,
          amount: 0,
          longDollars: 0,
          shortDollars: 0,
        };
        cur.amount += amt;
        if (isBuy) cur.longDollars += amt;
        else cur.shortDollars += amt;
        byId.set(id, cur);
      }

      const positions: PositionView[] = [];
      for (const [, p] of byId) {
        const u = findByInstrumentId(p.instrumentId);
        if (!u) continue;
        positions.push({
          ticker: u.ticker,
          symbolFull: u.symbolFull,
          instrumentId: p.instrumentId,
          name: u.name,
          amount: Math.round(p.amount * 100) / 100,
          isBuy: p.longDollars >= p.shortDollars,
        });
      }
      positions.sort((a, b) => b.amount - a.amount);

      if (positions.length > 0) {
        return NextResponse.json({ ok: true, positions, debug });
      }
      // Otherwise keep trying — the path returned 200 but found nothing
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      debug.push({ path, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    positions: [],
    debug,
    note: "No positions extracted from either endpoint. See debug for what we tried.",
  });
}

function collectPositions(data: Record<string, unknown>): RawPosition[] {
  const out: RawPosition[] = [];
  function visit(node: unknown) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) {
        if (item && typeof item === "object") {
          const r = item as RawPosition;
          if (r.InstrumentID || r.instrumentId || r.InstrumentId) out.push(r);
          else visit(item);
        }
      }
      return;
    }
    if (typeof node === "object") {
      for (const v of Object.values(node as Record<string, unknown>)) visit(v);
    }
  }
  visit(data);
  return out;
}
