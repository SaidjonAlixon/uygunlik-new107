import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { buildObservationWorkbook } from "@/lib/kalkulyator/excel-export";
import { monthName, normalizeCard } from "@/lib/kalkulyator/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Avval ro‘yxatdan o‘ting" }, { status: 401 });
  }
  try {
    verifyToken(header.slice(7));
  } catch {
    return NextResponse.json({ error: "Avval ro‘yxatdan o‘ting" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Noto‘g‘ri qiymat" }, { status: 400 });
  }
  const card = normalizeCard(body as never);
  if (!card.id) {
    return NextResponse.json({ error: "Ma’lumot topilmadi" }, { status: 400 });
  }
  try {
    const file = buildObservationWorkbook(card, monthName(card.activeMonth));
    const filename = "kuzatuv-karta.xlsx";
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Excel fayl yaratilmadi" }, { status: 500 });
  }
}
