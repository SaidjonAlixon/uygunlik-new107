import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { createEmptyCard, normalizeCard } from "@/lib/kalkulyator/model";
import {
  collectCardNumbers,
  createUniqueCardNumber,
  loadObservationCard,
  saveObservationCard,
} from "@/lib/kalkulyator/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userIdFromRequest(request: NextRequest): number | null {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const decoded = verifyToken(header.slice(7)) as { id?: number | string };
    const id = typeof decoded.id === "string" ? Number.parseInt(decoded.id, 10) : Number(decoded.id);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function cardIdFor(userId: number) {
  return `user-${userId}`;
}

async function withCardNumber(card: ReturnType<typeof normalizeCard>, existingCode: string) {
  const current = (existingCode || card.cardNumber).trim().toUpperCase();
  if (/^[A-Z]{2}\d{3}$/.test(current)) {
    return { ...card, cardNumber: current };
  }
  const taken = await collectCardNumbers();
  return { ...card, cardNumber: createUniqueCardNumber(taken) };
}

export async function GET(request: NextRequest) {
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Avval ro‘yxatdan o‘ting" }, { status: 401 });
  }
  const id = cardIdFor(userId);
  const existing = await loadObservationCard(id);
  const base = existing || createEmptyCard(id);
  const card = await withCardNumber(normalizeCard({ ...base, id }), existing?.cardNumber || "");
  if (!existing || card.cardNumber !== existing.cardNumber) {
    await saveObservationCard(card);
  }
  return NextResponse.json({ card });
}

export async function PUT(request: NextRequest) {
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Avval ro‘yxatdan o‘ting" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Noto‘g‘ri qiymat" }, { status: 400 });
  }
  const id = cardIdFor(userId);
  const existing = await loadObservationCard(id);
  const incoming = normalizeCard({ ...(body as object), id });
  if (!incoming.firstName && !incoming.lastName && existing) {
    incoming.firstName = existing.firstName;
    incoming.lastName = existing.lastName;
  }
  const card = await withCardNumber(incoming, existing?.cardNumber || "");
  const saved = await saveObservationCard(card);
  return NextResponse.json({ ok: true, card: saved });
}
