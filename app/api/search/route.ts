import { NextRequest, NextResponse } from "next/server";
import { searchUniverse } from "@/lib/universe";

export const revalidate = 3600;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "12");
  const hits = searchUniverse(q, Math.max(1, Math.min(40, limit)));
  return NextResponse.json({ hits });
}
