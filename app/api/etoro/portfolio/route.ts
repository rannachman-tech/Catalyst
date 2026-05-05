// Reads the connected user's live eToro portfolio.
// Tries both /trading/info/portfolio and /trading/info/demo/portfolio.
// Parser walks the response tree and matches instrumentID case-insensitively
// (eToro variously returns 'InstrumentID', 'instrumentID', 'instrumentId').

import { NextRequest, NextResponse } from "next/server";
import { findByInstrumentId } from "@/lib/universe";

const BASE = "https://public-api.etoro.com/api/v1";

function rid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as { randomUUID: () => string }).randomUUID()
    : Math.random().toString(36).slice(2);
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

  const tries =
    env === "demo"
      ? [`${BASE}/trading/info/demo/portfolio`, `${BASE}/trading/info/portfolio`]
      : [`${BASE}/trading/info/portfolio`, `${BASE}/trading/info/demo/portfolio`];

  const debug: Array<{
    path: string;
    status?: number;
    error?: string;
    rawCount?: number;
    topKeys?: string[];
    sampleKeys?: string[];
  }> = [];

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
      let data: unknown = {};
      try {
        data = JSON.parse(txt);
      } catch {
        debug.push({ path, status, error: "non-JSON response" });
        continue;
      }
      const containers = collectPositions(data);
      const topKeys = data && typeof data === "object" && !Array.isArray(data)
        ? Object.keys(data as Record<string, unknown>).slice(0, 12)
        : [];
      // Sample key names from the first nested object — helps diagnose unknown shapes.
      const sampleKeys = sampleNestedKeys(data, 25);
      debug.push({ path, status, rawCount: containers.length, topKeys, sampleKeys });

      if (!res.ok) continue;

      const byId = new Map<
        number,
        { instrumentId: number; amount: number; longDollars: number; shortDollars: number }
      >();
      for (const p of containers) {
        const id = p.instrumentId;
        if (!id) continue;
        const cur = byId.get(id) ?? {
          instrumentId: id,
          amount: 0,
          longDollars: 0,
          shortDollars: 0,
        };
        cur.amount += p.amount;
        if (p.isBuy) cur.longDollars += p.amount;
        else cur.shortDollars += p.amount;
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      debug.push({ path, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    positions: [],
    debug,
    note: "No positions extracted from either endpoint.",
  });
}

interface ExtractedPosition {
  instrumentId: number;
  amount: number;
  isBuy: boolean;
}

// Walk the entire response tree. For each object node, look for ANY key whose
// lowercase form matches /^instrument(id)?$/ — covers InstrumentID, instrumentID,
// instrumentId, InstrumentId, etc.
function collectPositions(data: unknown): ExtractedPosition[] {
  const out: ExtractedPosition[] = [];

  function valueByKey(node: Record<string, unknown>, ...candidates: string[]): unknown {
    for (const k of Object.keys(node)) {
      const lk = k.toLowerCase();
      for (const c of candidates) {
        if (lk === c.toLowerCase()) return node[k];
      }
    }
    return undefined;
  }

  function visit(node: unknown) {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      const id = valueByKey(obj, "InstrumentID", "instrumentID", "instrumentId", "InstrumentId");
      if (typeof id === "number" && id > 0) {
        const amount =
          (valueByKey(obj, "OpenAmount", "Amount", "amount", "TotalInvested", "InvestedAmount") as number | undefined) ?? 0;
        const isBuyRaw = valueByKey(obj, "IsBuy", "isBuy");
        const direction = valueByKey(obj, "Direction", "direction");
        const isBuy =
          typeof isBuyRaw === "boolean"
            ? isBuyRaw
            : typeof direction === "number"
            ? direction === 1
            : true;
        out.push({ instrumentId: id, amount: Number(amount) || 0, isBuy });
      }
      for (const v of Object.values(obj)) visit(v);
    }
  }
  visit(data);
  return out;
}

function sampleNestedKeys(data: unknown, max: number): string[] {
  const seen = new Set<string>();
  function visit(node: unknown, depth = 0) {
    if (!node || depth > 4 || seen.size >= max) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth);
      return;
    }
    if (typeof node === "object") {
      for (const k of Object.keys(node as Record<string, unknown>)) {
        seen.add(k);
        if (seen.size >= max) return;
      }
      for (const v of Object.values(node as Record<string, unknown>)) visit(v, depth + 1);
    }
  }
  visit(data);
  return Array.from(seen).slice(0, max);
}
