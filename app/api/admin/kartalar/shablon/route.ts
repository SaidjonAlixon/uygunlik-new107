import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { buildAdminTemplate } from "@/lib/kalkulyator/excel-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin huquqi kerak" }, { status: 403 });
  }

  let startDate = "";
  try {
    const body = await request.json();
    startDate = String(body?.startDate || "");
  } catch {
    startDate = "";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: "1-kun sanasini tanlang" }, { status: 400 });
  }

  try {
    const file = buildAdminTemplate(startDate);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="kuzatuv-shablon.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Excel fayl yaratilmadi" }, { status: 500 });
  }
}
