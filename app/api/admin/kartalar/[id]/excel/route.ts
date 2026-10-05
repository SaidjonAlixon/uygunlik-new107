import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { buildPersonYearWorkbook } from "@/lib/kalkulyator/excel-export";
import { downloadFileName } from "@/lib/kalkulyator/excel-uz";
import { loadObservationCard } from "@/lib/kalkulyator/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin huquqi kerak" }, { status: 403 });
  }

  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    return NextResponse.json({ error: "Karta topilmadi" }, { status: 404 });
  }

  const card = await loadObservationCard(id);
  if (!card) {
    return NextResponse.json({ error: "Bu odamning kartasi yo‘q" }, { status: 404 });
  }

  try {
    const file = buildPersonYearWorkbook(card);
    const filename = downloadFileName(card);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Excel fayl yaratilmadi" }, { status: 500 });
  }
}
