import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const BASE = "https://public-api.etoro.com/api/v1";

function rid() {
  return (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? (crypto as { randomUUID: () => string }).randomUUID()
    : Math.random().toString(36).slice(2);
}

function headers(apiKey: string, userKey: string) {
  return {
    "x-api-key": apiKey,
    "x-user-key": userKey,
    "x-request-id": rid(),
    accept: "application/json",
    "content-type": "application/json",
  } as Record<string, string>;
}

export async function POST(req: NextRequest) {
  const { apiKey, userKey } = (await req.json().catch(() => ({}))) as {
    apiKey?: string;
    userKey?: string;
  };
  if (!apiKey || !userKey) {
    return NextResponse.json(
      { ok: false, error: "Missing keys." },
      { status: 400 }
    );
  }
  try {
    const meRes = await fetch(`${BASE}/me`, { headers: headers(apiKey, userKey) });
    if (!meRes.ok) {
      return NextResponse.json(
        { ok: false, error: `eToro /me returned ${meRes.status}.` },
        { status: 200 }
      );
    }
    const me = (await meRes.json()) as { realCid?: number; gcid?: number };
    const realCid = me.realCid;
    if (!realCid) {
      return NextResponse.json(
        { ok: false, error: "Missing realCid in /me response." },
        { status: 200 }
      );
    }

    const pplRes = await fetch(
      `${BASE}/user-info/people?cidList=${realCid}`,
      { headers: headers(apiKey, userKey) }
    );
    if (!pplRes.ok) {
      return NextResponse.json(
        { ok: false, error: `eToro /user-info/people returned ${pplRes.status}.` },
        { status: 200 }
      );
    }
    const ppl = (await pplRes.json()) as
      | Array<Record<string, unknown>>
      | { users?: Array<Record<string, unknown>>; people?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>>; ppl?: Array<Record<string, unknown>> };
    const profile =
      (Array.isArray(ppl) ? ppl[0] : null) ??
      (ppl as { users?: Array<Record<string, unknown>> }).users?.[0] ??
      (ppl as { people?: Array<Record<string, unknown>> }).people?.[0] ??
      (ppl as { data?: Array<Record<string, unknown>> }).data?.[0] ??
      (ppl as { ppl?: Array<Record<string, unknown>> }).ppl?.[0];
    const username = (profile as { userName?: string; username?: string } | undefined)?.userName
      ?? (profile as { username?: string } | undefined)?.username
      ?? "trader";

    // Detect env: probe portfolio.
    const portRes = await fetch(`${BASE}/trading/info/portfolio`, {
      headers: headers(apiKey, userKey),
    });
    const detectedEnv: "real" | "demo" = portRes.ok ? "real" : "demo";

    return NextResponse.json({
      ok: true,
      detectedEnv,
      username,
      cid: realCid,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error.";
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}
