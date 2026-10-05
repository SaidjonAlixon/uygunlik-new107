import fs from "fs/promises";
import path from "path";
import pool from "@/lib/postgres";
import { normalizeCard, type ObservationCard } from "./model";

const DATA_FILE = path.join(process.cwd(), "data", "observation-cards.json");

async function readFileStore(): Promise<Record<string, ObservationCard>> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Record<string, ObservationCard>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeFileStore(cards: Record<string, ObservationCard>) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(cards), "utf8");
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS observation_cards (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function saveObservationCard(input: ObservationCard): Promise<ObservationCard> {
  const card = normalizeCard({ ...input, updatedAt: new Date().toISOString() });
  const fileCards = await readFileStore();
  fileCards[card.id] = card;
  await writeFileStore(fileCards);

  if (!process.env.DATABASE_URL) return card;

  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO observation_cards (id, first_name, last_name, payload, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE
       SET first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           payload = EXCLUDED.payload,
           updated_at = CURRENT_TIMESTAMP`,
      [card.id, card.firstName, card.lastName, JSON.stringify(card)]
    );
  } catch (error) {
    console.error("Kalkulyator kartasi bazaga yozilmadi:", error);
  }

  return card;
}

const CODE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export async function collectCardNumbers(): Promise<Set<string>> {
  const taken = new Set<string>();
  const fileCards = await readFileStore();
  for (const card of Object.values(fileCards)) {
    const code = card.cardNumber?.trim().toUpperCase();
    if (code) taken.add(code);
  }
  if (!process.env.DATABASE_URL) return taken;
  try {
    await ensureTable();
    const result = await pool.query(`SELECT payload->>'cardNumber' AS code FROM observation_cards`);
    for (const row of result.rows) {
      const code = String(row.code || "").trim().toUpperCase();
      if (code) taken.add(code);
    }
  } catch (error) {
    console.error("Karta raqamlari o‘qilmadi:", error);
  }
  return taken;
}

export function createUniqueCardNumber(taken: Set<string>): string {
  for (let attempt = 0; attempt < 300; attempt++) {
    const letters =
      CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)] +
      CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
    const digits = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const code = `${letters}${digits}`;
    if (!taken.has(code)) {
      taken.add(code);
      return code;
    }
  }
  throw new Error("Karta raqami yaratilmadi");
}

export async function listAllObservationCards(): Promise<ObservationCard[]> {
  const merged = new Map<string, ObservationCard>();
  const fileCards = await readFileStore();
  for (const card of Object.values(fileCards)) {
    if (card?.id) merged.set(card.id, normalizeCard(card));
  }

  if (!process.env.DATABASE_URL) return [...merged.values()];

  try {
    await ensureTable();
    const result = await pool.query(`SELECT payload, updated_at FROM observation_cards`);
    for (const row of result.rows) {
      if (!row.payload) continue;
      const card = normalizeCard(row.payload);
      if (!card.id) continue;
      const current = merged.get(card.id);
      const remoteTime = new Date(row.updated_at || card.updatedAt || 0).getTime();
      const localTime = new Date(current?.updatedAt || 0).getTime();
      if (!current || remoteTime >= localTime) merged.set(card.id, card);
    }
  } catch (error) {
    console.error("Kalkulyator kartalari ro‘yxati o‘qilmadi:", error);
  }

  return [...merged.values()];
}

export async function loadObservationCard(id: string): Promise<ObservationCard | null> {
  if (process.env.DATABASE_URL) {
    try {
      await ensureTable();
      const result = await pool.query(`SELECT payload FROM observation_cards WHERE id = $1`, [id]);
      if (result.rows[0]?.payload) {
        return normalizeCard(result.rows[0].payload);
      }
    } catch (error) {
      console.error("Kalkulyator kartasi bazadan o‘qilmadi:", error);
    }
  }

  const fileCards = await readFileStore();
  return fileCards[id] ? normalizeCard(fileCards[id]) : null;
}
