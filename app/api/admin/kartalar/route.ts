import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/admin-auth";
import pool from "@/lib/postgres";
import { DAY_COUNT, dayHasData } from "@/lib/kalkulyator/model";
import { listAllObservationCards } from "@/lib/kalkulyator/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CardRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cardNumber: string;
  filledDays: number;
  dayCount: number;
  hasCard: boolean;
  updatedAt: string;
};

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin huquqi kerak" }, { status: 403 });
  }

  try {
    const cards = await listAllObservationCards();
    const byUserId = new Map<number, (typeof cards)[number]>();
    const orphans: (typeof cards)[number][] = [];
    for (const card of cards) {
      const match = /^user-(\d+)$/.exec(card.id);
      if (match) byUserId.set(Number(match[1]), card);
      else orphans.push(card);
    }

    const rows: CardRow[] = [];
    if (process.env.DATABASE_URL) {
      const users = await pool.query(
        `SELECT id, first_name, last_name, email FROM users ORDER BY last_name ASC, first_name ASC`
      );
      const seen = new Set<number>();
      for (const user of users.rows) {
        const id = Number(user.id);
        seen.add(id);
        const card = byUserId.get(id);
        rows.push(toRow(card, {
          id: card?.id || `user-${id}`,
          firstName: card?.firstName || String(user.first_name || ""),
          lastName: card?.lastName || String(user.last_name || ""),
          email: String(user.email || ""),
        }));
      }
      for (const [userId, card] of byUserId) {
        if (!seen.has(userId)) rows.push(toRow(card, { id: card.id, firstName: card.firstName, lastName: card.lastName, email: "" }));
      }
    } else {
      for (const card of cards) {
        rows.push(toRow(card, { id: card.id, firstName: card.firstName, lastName: card.lastName, email: "" }));
      }
    }

    for (const card of orphans) {
      rows.push(toRow(card, { id: card.id, firstName: card.firstName, lastName: card.lastName, email: "" }));
    }

    rows.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "uz"));
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server xatoligi" }, { status: 500 });
  }
}

function toRow(
  card: { cardNumber: string; days: Parameters<typeof dayHasData>[0][]; updatedAt?: string; id: string } | undefined,
  identity: { id: string; firstName: string; lastName: string; email: string }
): CardRow {
  return {
    id: identity.id,
    firstName: identity.firstName,
    lastName: identity.lastName,
    email: identity.email,
    cardNumber: card?.cardNumber || "",
    filledDays: card ? card.days.filter(dayHasData).length : 0,
    dayCount: DAY_COUNT,
    hasCard: Boolean(card),
    updatedAt: card?.updatedAt || "",
  };
}
