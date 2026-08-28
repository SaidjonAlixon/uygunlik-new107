import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const text = readFileSync(resolve(process.cwd(), file), 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i < 0) continue;
        const key = t.slice(0, i).trim();
        let val = t.slice(i + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      /* missing file */
    }
  }
}

loadEnv();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL topilmadi');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query(`
      ALTER TABLE lessons
      ADD COLUMN IF NOT EXISTS test_visible_lesson_ids INTEGER[] DEFAULT '{}'
    `);
    await pool.query(`
      ALTER TABLE lesson_sections
      ADD COLUMN IF NOT EXISTS test_questions JSONB DEFAULT '[]'::jsonb
    `);
    await pool.query(`
      ALTER TABLE test_submissions
      ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES lesson_sections(id) ON DELETE CASCADE
    `);
    await pool.query(`
      ALTER TABLE test_submissions
      ADD COLUMN IF NOT EXISTS retake_allowed BOOLEAN DEFAULT FALSE
    `);
    try {
      await pool.query(`ALTER TABLE test_submissions ALTER COLUMN lesson_id DROP NOT NULL`);
    } catch {
      /* already nullable */
    }

    const r = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'lessons' AND column_name = 'test_visible_lesson_ids'
    `);
    console.log('OK test_visible_lesson_ids:', r.rows.length > 0);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
