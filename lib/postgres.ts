import { Pool, types } from 'pg';
import type { RatingEntry } from '@/types/rating';

// TIMESTAMP WITHOUT TIME ZONE — Railway UTC saqlaydi; lokal TZ (+5) qo'shib o'qimaslik
types.setTypeParser(types.builtins.TIMESTAMP, (value: string) => {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const hasTz = /[zZ]|[+-]\d{2}(:?\d{2})?$/.test(normalized);
  return new Date(hasTz ? normalized : `${normalized}Z`);
});

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
});

const globalForDb = globalThis as typeof globalThis & {
  __uygunlikDbReady?: boolean;
  __uygunlikDbInit?: Promise<void>;
  __uygunlikSchemaVersion?: number;
};

async function runDatabaseInitialization() {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL database connected');

    // Create tariffs table FIRST (users references it)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tariffs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status BOOLEAN DEFAULT true,
        tariff_id INTEGER REFERENCES tariffs(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        courses JSONB DEFAULT '[]'::jsonb
      )
    `);

    // Migration: Handle camelCase column names from previous versions
    await pool.query(`
      DO $$ 
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'createdAt') THEN
          ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updatedAt') THEN
          ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;
        END IF;
      END $$;
    `);

    // Add tariff_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tariff_id INTEGER REFERENCES tariffs(id) ON DELETE SET NULL
    `);

    // Add courses column if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'courses'
        ) THEN
          ALTER TABLE users ADD COLUMN courses JSONB DEFAULT '[]'::jsonb;
        END IF;
      END $$;
    `);

    // Create courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        category TEXT[],
        videos JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create videos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        filename VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        type VARCHAR(100) DEFAULT 'video/mp4',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add type column if it doesn't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'videos' AND column_name = 'type'
        ) THEN
          ALTER TABLE videos ADD COLUMN type VARCHAR(100) DEFAULT 'video/mp4';
          -- Update existing rows
          UPDATE videos SET type = 'video/mp4' WHERE type IS NULL;
        END IF;
      END $$;
    `);

    // Add filename column if it doesn't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'videos' AND column_name = 'filename'
        ) THEN
          ALTER TABLE videos ADD COLUMN filename VARCHAR(255);
          -- Update existing rows with a default if necessary
          UPDATE videos SET filename = 'default.mp4' WHERE filename IS NULL;
          -- Now make it NOT NULL
          ALTER TABLE videos ALTER COLUMN filename SET NOT NULL;
        END IF;
      END $$;
    `);

    // Create user_courses junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_courses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, course_id)
      )
    `);

    // Create lessons table (darslar)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        tariff_id INTEGER REFERENCES tariffs(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500),
        pdf_url VARCHAR(500),
        order_number INTEGER DEFAULT 0,
        additional_resources JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500)
    `);
    await pool.query(`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS test_url VARCHAR(500)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, lesson_id)
      )
    `);

    // Add test_questions to lessons
    await pool.query(`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS test_questions JSONB DEFAULT '[]'::jsonb
    `);

    // Create lesson sections (bo'limlar) table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_sections (
        id SERIAL PRIMARY KEY,
        tariff_id INTEGER REFERENCES tariffs(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        order_number INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES lesson_sections(id) ON DELETE CASCADE
    `);

    await pool.query(`
      ALTER TABLE lesson_sections ADD COLUMN IF NOT EXISTS description TEXT
    `);

    // Bo'lim ↔ tarif (ko'p-ko'p): bitta bo'lim bir nechta tarifda chiqishi mumkin
    await pool.query(`
      CREATE TABLE IF NOT EXISTS section_tariffs (
        id SERIAL PRIMARY KEY,
        section_id INTEGER NOT NULL REFERENCES lesson_sections(id) ON DELETE CASCADE,
        tariff_id INTEGER NOT NULL REFERENCES tariffs(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(section_id, tariff_id)
      )
    `);

    // Mavjud bo'limlarni junction jadvaliga ko'chirish
    await pool.query(`
      INSERT INTO section_tariffs (section_id, tariff_id)
      SELECT id, tariff_id FROM lesson_sections
      WHERE tariff_id IS NOT NULL
      ON CONFLICT (section_id, tariff_id) DO NOTHING
    `);

    // Migrate existing lessons without section into default section per tariff
    const tariffsWithOrphanLessons = await pool.query(`
      SELECT DISTINCT tariff_id FROM lessons WHERE section_id IS NULL AND tariff_id IS NOT NULL
    `);
    for (const row of tariffsWithOrphanLessons.rows) {
      const tariffId = row.tariff_id;
      const defaultSection = await pool.query(`
        INSERT INTO lesson_sections (tariff_id, name, order_number)
        VALUES ($1, 'Umumiy bo''lim', 1)
        RETURNING id
      `, [tariffId]);
      await pool.query(`
        INSERT INTO section_tariffs (section_id, tariff_id)
        VALUES ($1, $2)
        ON CONFLICT (section_id, tariff_id) DO NOTHING
      `, [defaultSection.rows[0].id, tariffId]);
      await pool.query(`
        UPDATE lessons SET section_id = $1 WHERE tariff_id = $2 AND section_id IS NULL
      `, [defaultSection.rows[0].id, tariffId]);
    }

    // Create test_submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        answers JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bo'lim testi + qayta ishlash ruxsati
    await pool.query(`
      ALTER TABLE test_submissions ALTER COLUMN lesson_id DROP NOT NULL
    `).catch(() => { /* already nullable */ });
    await pool.query(`
      ALTER TABLE test_submissions
        ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES lesson_sections(id) ON DELETE CASCADE
    `);
    await pool.query(`
      ALTER TABLE test_submissions
        ADD COLUMN IF NOT EXISTS retake_allowed BOOLEAN DEFAULT FALSE
    `);

    // Bo'lim uchun umumiy test savollari
    await pool.query(`
      ALTER TABLE lesson_sections
        ADD COLUMN IF NOT EXISTS test_questions JSONB DEFAULT '[]'::jsonb
    `);

    // Dars testi boshqa darslarda ham ko'rinsin (lesson id lar)
    await pool.query(`
      ALTER TABLE lessons
        ADD COLUMN IF NOT EXISTS test_visible_lesson_ids INTEGER[] DEFAULT '{}'
    `);

    // Create default admin user if not exists (admin panel kirish uchun)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@uygunlik.uz';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminExists = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await pool.query(`
        INSERT INTO users (first_name, last_name, email, password, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['Admin', 'User', adminEmail, hashedPassword, 'admin', true]);
      console.log('✅ Default admin user created');
    }

    // Bir xil created_at bo'lgan foydalanuvchilarga ID bo'yicha ketma-ket vaqt berish
    await pool.query(`
      WITH ranked AS (
        SELECT
          id,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY date_trunc('second', created_at) ORDER BY id ASC) AS rn,
          COUNT(*) OVER (PARTITION BY date_trunc('second', created_at)) AS grp_count
        FROM users
      )
      UPDATE users u
      SET created_at = u.created_at + ((r.rn - 1) * INTERVAL '1 minute')
      FROM ranked r
      WHERE u.id = r.id AND r.grp_count > 1 AND r.rn > 1
    `);

    // Create sample video if not exists
    const videoExists = await pool.query('SELECT id FROM videos WHERE filename = $1', ['0406.mp4']);
    if (videoExists.rows.length === 0) {
      await pool.query(`
        INSERT INTO videos (title, description, filename, url)
        VALUES ($1, $2, $3, $4)
      `, [
        'Namuna Video',
        'Bu namuna video',
        '0406.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      ]);

      console.log('✅ Sample video created');
    }

    globalForDb.__uygunlikDbReady = true;
    console.log('✅ Database initialized successfully');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error);
    throw new Error(`Failed to connect to PostgreSQL database: ${error.message}. Please check your DATABASE_URL environment variable.`);
  }
}

export async function initializeDatabase() {
  const SCHEMA_VERSION = 3; // bump when adding columns so HMR/restart re-runs migrations
  if (
    globalForDb.__uygunlikDbReady &&
    globalForDb.__uygunlikSchemaVersion === SCHEMA_VERSION
  ) {
    return;
  }

  // Schema yangilanganda qayta migratsiya
  if (globalForDb.__uygunlikSchemaVersion !== SCHEMA_VERSION) {
    globalForDb.__uygunlikDbReady = false;
    globalForDb.__uygunlikDbInit = undefined;
  }

  if (!globalForDb.__uygunlikDbInit) {
    globalForDb.__uygunlikDbInit = runDatabaseInitialization()
      .then(() => {
        globalForDb.__uygunlikSchemaVersion = SCHEMA_VERSION;
      })
      .catch((error) => {
        globalForDb.__uygunlikDbInit = undefined;
        throw error;
      });
  }

  await globalForDb.__uygunlikDbInit;
}

// User operations
export class UserService {
  static async create(userData: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role?: string;
    status?: boolean;
  }) {
    const result = await pool.query(`
      INSERT INTO users (first_name, last_name, email, password, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      userData.first_name,
      userData.last_name,
      userData.email,
      userData.password,
      userData.role || 'user',
      userData.status !== undefined ? userData.status : true
    ]);

    return result.rows[0];
  }

  static async findByEmail(email: string) {
    const result = await pool.query(`
      SELECT 
        u.*,
        t.id as tariff_table_id,
        t.name as tariff_name,
        t.price as tariff_price
      FROM users u
      LEFT JOIN tariffs t ON u.tariff_id = t.id
      WHERE u.email = $1
    `, [email]);

    if (!result.rows[0]) return null;

    const user = result.rows[0];
    // Format user data with tariff info
    return {
      ...user,
      tariff: user.tariff_table_id ? {
        id: user.tariff_table_id,
        name: user.tariff_name,
        price: parseFloat(user.tariff_price) || 0
      } : null
    };
  }

  static async findById(id: number) {
    const result = await pool.query(`
      SELECT 
        u.*,
        t.id as tariff_table_id,
        t.name as tariff_name,
        t.price as tariff_price
      FROM users u
      LEFT JOIN tariffs t ON u.tariff_id = t.id
      WHERE u.id = $1
    `, [id]);

    if (!result.rows[0]) return null;

    const user = result.rows[0];
    // Format user data with tariff info
    return {
      ...user,
      tariff: user.tariff_table_id ? {
        id: user.tariff_table_id,
        name: user.tariff_name,
        price: parseFloat(user.tariff_price) || 0
      } : null
    };
  }

  static async findAll(page: number = 1, limit: number = 10, search: string = '') {
    const offset = (page - 1) * limit;
    let query = `
      SELECT u.*, t.name as tariff_name
      FROM users u
      LEFT JOIN tariffs t ON u.tariff_id = t.id
    `;
    let params: any[] = [];
    if (search) {
      query += ' WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1';
      params.push(`%${search}%`);
    }
    query += ` ORDER BY u.id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) FROM users u';
    let countParams: any[] = [];
    if (search) {
      countQuery += ' WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1';
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /** Excel export uchun barcha foydalanuvchilar (parolsiz), ID bo'yicha */
  static async findAllForExport() {
    const result = await pool.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.status,
        u.tariff_id,
        u.created_at,
        u.updated_at,
        t.name as tariff_name
      FROM users u
      LEFT JOIN tariffs t ON u.tariff_id = t.id
      ORDER BY u.id ASC
    `);
    return result.rows;
  }

  static async update(id: number, updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: boolean;
    tariff_id?: number | null;
  }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (!result.rows[0]) return null;
    // Return full user with tariff join so admin UI keeps tariff_name after grant/update
    return this.findById(id);
  }

  static async delete(id: number) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

// Course operations
export class CourseService {
  static async create(courseData: {
    title: string;
    description?: string;
    price?: number;
    category?: string[];
    videos?: any[];
  }) {
    const result = await pool.query(`
      INSERT INTO courses (title, description, price, category, videos)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      courseData.title,
      courseData.description || '',
      courseData.price || 0,
      courseData.category || [],
      JSON.stringify(courseData.videos || [])
    ]);

    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    return result.rows.map(row => ({
      ...row,
      category: row.category || [],
      videos: row.videos || [],
    }));
  }

  static async findById(id: number) {
    const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async update(id: number, updates: any) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'videos' || key === 'category') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    console.log('Course update query:', query);
    console.log('Course update values:', values);

    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }

  static async delete(id: number) {
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

// Video operations
export class VideoService {
  static async create(videoData: {
    title: string;
    description?: string;
    filename: string;
    url: string;
  }) {
    const result = await pool.query(`
      INSERT INTO videos (title, description, filename, url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      videoData.title,
      videoData.description || '',
      videoData.filename,
      videoData.url
    ]);

    return result.rows[0];
  }

  static async findAll() {
    const result = await pool.query('SELECT * FROM videos ORDER BY created_at DESC');
    return result.rows;
  }

  static async findById(id: number) {
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByFilename(filename: string) {
    const result = await pool.query('SELECT * FROM videos WHERE filename = $1', [filename]);
    return result.rows[0] || null;
  }

  static async findByUrl(url: string) {
    const result = await pool.query('SELECT * FROM videos WHERE url = $1 OR url LIKE $2', [url, `%${url}%`]);
    return result.rows[0] || null;
  }

  static async update(id: number, updates: any) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE videos SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }


  static async delete(id: number) {
    const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}


// Tariff operations
export class TariffService {
  static async findAll() {
    const result = await pool.query(`
      SELECT t.*, 
        COUNT(l.id) as lessons_count
      FROM tariffs t
      LEFT JOIN lessons l ON t.id = l.tariff_id
      GROUP BY t.id
      ORDER BY t.price ASC
    `);
    return result.rows.map(row => ({
      ...row,
      lessons_count: parseInt(row.lessons_count) || 0
    }));
  }

  static async findById(id: number) {
    const result = await pool.query('SELECT * FROM tariffs WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(tariffData: {
    name: string;
    description?: string;
    price: number;
  }) {
    const result = await pool.query(`
      INSERT INTO tariffs (name, description, price)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [
      tariffData.name,
      tariffData.description || '',
      tariffData.price
    ]);
    return result.rows[0];
  }

  static async update(id: number, updates: {
    name?: string;
    description?: string;
    price?: number;
  }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE tariffs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number) {
    const result = await pool.query('DELETE FROM tariffs WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

// Lesson section (bo'lim) operations
export class SectionService {
  static async getTariffIds(sectionId: number): Promise<number[]> {
    const result = await pool.query(
      'SELECT tariff_id FROM section_tariffs WHERE section_id = $1 ORDER BY tariff_id ASC',
      [sectionId]
    );
    const ids = result.rows.map((r: { tariff_id: number }) => Number(r.tariff_id));
    if (ids.length > 0) return ids;

    // Fallback: eski yozuvlar uchun primary tariff_id
    const section = await pool.query('SELECT tariff_id FROM lesson_sections WHERE id = $1', [sectionId]);
    const primary = section.rows[0]?.tariff_id;
    return primary != null ? [Number(primary)] : [];
  }

  static async setTariffIds(sectionId: number, tariffIds: number[]) {
    const unique = [...new Set(
      tariffIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
    )];
    if (unique.length === 0) {
      throw new Error("Bo'lim uchun kamida bitta tarif tanlanishi kerak");
    }

    await pool.query('DELETE FROM section_tariffs WHERE section_id = $1', [sectionId]);
    for (const tariffId of unique) {
      await pool.query(
        `INSERT INTO section_tariffs (section_id, tariff_id)
         VALUES ($1, $2)
         ON CONFLICT (section_id, tariff_id) DO NOTHING`,
        [sectionId, tariffId]
      );
    }

    // Primary tariff_id ni saqlab turamiz (orqaga moslik)
    await pool.query(
      `UPDATE lesson_sections
       SET tariff_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [unique[0], sectionId]
    );

    return unique;
  }

  static async attachTariffIds<T extends { id: number; tariff_id?: number }>(section: T) {
    const tariff_ids = await this.getTariffIds(section.id);
    return { ...section, tariff_ids };
  }

  static async findAll() {
    const result = await pool.query(`
      SELECT s.*
      FROM lesson_sections s
      ORDER BY s.order_number ASC, s.created_at ASC
    `);
    return Promise.all(
      result.rows.map(async (section: { id: number }) => this.attachTariffIds(section))
    );
  }

  static async findAllByTariff(tariffId: number) {
    const result = await pool.query(`
      SELECT DISTINCT s.*
      FROM lesson_sections s
      LEFT JOIN section_tariffs st ON st.section_id = s.id
      WHERE s.tariff_id = $1 OR st.tariff_id = $1
      ORDER BY s.order_number ASC, s.created_at ASC
    `, [tariffId]);

    const sections = result.rows;
    const withTariffs = await Promise.all(
      sections.map(async (section: { id: number }) => this.attachTariffIds(section))
    );
    return withTariffs;
  }

  static async findById(id: number) {
    const result = await pool.query('SELECT * FROM lesson_sections WHERE id = $1', [id]);
    const section = result.rows[0];
    if (!section) return null;
    return this.attachTariffIds(section);
  }

  static async create(data: {
    tariff_id: number;
    name: string;
    description?: string;
    order_number?: number;
    tariff_ids?: number[];
  }) {
    const result = await pool.query(`
      INSERT INTO lesson_sections (tariff_id, name, description, order_number)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [data.tariff_id, data.name, data.description || '', data.order_number || 0]);

    const section = result.rows[0];
    const tariffIds = data.tariff_ids?.length
      ? data.tariff_ids
      : [data.tariff_id];
    const normalized = tariffIds.includes(data.tariff_id)
      ? tariffIds
      : [data.tariff_id, ...tariffIds];

    await this.setTariffIds(section.id, normalized);
    return this.attachTariffIds(section);
  }

  static async update(
    id: number,
    updates: {
      name?: string;
      description?: string;
      order_number?: number;
      tariff_ids?: number[];
      test_questions?: any[];
    }
  ) {
    const { tariff_ids, test_questions, ...rest } = updates;
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (test_questions !== undefined) {
      fields.push(`test_questions = $${paramCount}`);
      values.push(JSON.stringify(test_questions));
      paramCount++;
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      await pool.query(
        `UPDATE lesson_sections SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
    }

    if (tariff_ids !== undefined) {
      await this.setTariffIds(id, tariff_ids);
    }

    return this.findById(id);
  }

  static async delete(id: number) {
    const result = await pool.query('DELETE FROM lesson_sections WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }

  static async findAllWithLessonsByTariff(tariffId: number) {
    const sections = await this.findAllByTariff(tariffId);
    const lessons = await LessonService.findAllByTariff(tariffId);
    return sections.map((section) => ({
      ...section,
      lessons: lessons.filter((l: { section_id?: number }) => l.section_id === section.id),
    }));
  }
}

// Lesson operations
export class LessonService {
  static async findAllByTariff(tariffId: number) {
    // Bo'lim boshqa tarifga ham biriktirilgan bo'lsa — darslar shu tarifda ham chiqadi
    const result = await pool.query(`
      SELECT DISTINCT ON (l.id)
        l.*, s.name as section_name, s.order_number as section_order
      FROM lessons l
      LEFT JOIN lesson_sections s ON s.id = l.section_id
      LEFT JOIN section_tariffs st ON st.section_id = l.section_id
      WHERE l.tariff_id = $1
         OR st.tariff_id = $1
         OR s.tariff_id = $1
      ORDER BY l.id, s.order_number ASC NULLS LAST, l.order_number ASC, l.created_at ASC
    `, [tariffId]);

    // DISTINCT ON tartibini saqlash uchun qayta sort
    return result.rows.sort((a: any, b: any) => {
      const so = (a.section_order ?? 9999) - (b.section_order ?? 9999);
      if (so !== 0) return so;
      return (a.order_number ?? 0) - (b.order_number ?? 0);
    });
  }

  static async findById(id: number) {
    const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /** Shu darsda ko'rsatiladigan test: o'z testi yoki boshqa darsdan ulangan */
  static async findQuizSourceForLesson(lessonId: number) {
    const own = await this.findById(lessonId);
    if (!own) return null;

    const ownQs = typeof own.test_questions === 'string'
      ? JSON.parse(own.test_questions || '[]')
      : (own.test_questions || []);
    if (Array.isArray(ownQs) && ownQs.length > 0) {
      return { sourceLesson: own, questions: ownQs };
    }

    const linked = await pool.query(
      `SELECT * FROM lessons
       WHERE $1 = ANY(COALESCE(test_visible_lesson_ids, '{}'))
         AND jsonb_array_length(COALESCE(test_questions, '[]'::jsonb)) > 0
       ORDER BY id ASC
       LIMIT 1`,
      [lessonId]
    );
    if (!linked.rows[0]) return null;
    const src = linked.rows[0];
    const qs = typeof src.test_questions === 'string'
      ? JSON.parse(src.test_questions || '[]')
      : (src.test_questions || []);
    return { sourceLesson: src, questions: qs };
  }

  static async create(lessonData: {
    tariff_id: number;
    section_id: number;
    title: string;
    description?: string;
    video_url?: string;
    pdf_url?: string;
    test_url?: string;
    test_questions?: any[];
    order_number?: number;
    additional_resources?: any[];
  }) {
    const result = await pool.query(`
      INSERT INTO lessons (tariff_id, section_id, title, description, video_url, pdf_url, test_url, test_questions, order_number, additional_resources)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      lessonData.tariff_id,
      lessonData.section_id,
      lessonData.title,
      lessonData.description || '',
      lessonData.video_url || '',
      lessonData.pdf_url || '',
      lessonData.test_url || '',
      JSON.stringify(lessonData.test_questions || []),
      lessonData.order_number || 0,
      JSON.stringify(lessonData.additional_resources || [])
    ]);
    return result.rows[0];
  }

  static async update(id: number, updates: {
    title?: string;
    description?: string;
    video_url?: string;
    pdf_url?: string;
    test_url?: string;
    test_questions?: any[];
    test_visible_lesson_ids?: number[];
    order_number?: number;
    section_id?: number;
    additional_resources?: any[];
  }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'additional_resources' || key === 'test_questions') {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else if (key === 'test_visible_lesson_ids') {
          fields.push(`${key} = $${paramCount}`);
          values.push(Array.isArray(value) ? value : []);
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE lessons SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number) {
    const result = await pool.query('DELETE FROM lessons WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }

  static async findAllWithTariff() {
    const result = await pool.query(`
      SELECT l.*, t.name as tariff_name 
      FROM lessons l
      LEFT JOIN tariffs t ON t.id = l.tariff_id
      ORDER BY l.tariff_id, l.order_number ASC
    `);
    return result.rows;
  }
}

export class LessonProgressService {
  static async getByUserAndTariff(userId: number, tariffId: number) {
    const result = await pool.query(`
      SELECT lesson_id, progress_percent
      FROM lesson_progress lp
      JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = $1 AND l.tariff_id = $2
    `, [userId, tariffId]);
    const map: Record<number, number> = {};
    result.rows.forEach((r: { lesson_id: number; progress_percent: number }) => {
      map[r.lesson_id] = r.progress_percent;
    });
    return map;
  }

  static async upsert(userId: number, lessonId: number, progressPercent: number) {
    const p = Math.min(100, Math.max(0, Math.round(progressPercent)));
    await pool.query(`
      INSERT INTO lesson_progress (user_id, lesson_id, progress_percent, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET progress_percent = GREATEST(lesson_progress.progress_percent, $3), updated_at = CURRENT_TIMESTAMP
    `, [userId, lessonId, p]);
    return { lesson_id: lessonId, progress_percent: p };
  }
}

export class TestSubmissionService {
  /** Oxirgi urinish: qayta ishlash mumkinmi? */
  static async getAttemptStatus(params: {
    user_id: number;
    lesson_id?: number | null;
    section_id?: number | null;
  }) {
    let result;
    if (params.section_id) {
      result = await pool.query(
        `SELECT id, retake_allowed, score, total_questions, created_at
         FROM test_submissions
         WHERE user_id = $1 AND section_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [params.user_id, params.section_id]
      );
    } else if (params.lesson_id) {
      result = await pool.query(
        `SELECT id, retake_allowed, score, total_questions, created_at
         FROM test_submissions
         WHERE user_id = $1 AND lesson_id = $2 AND section_id IS NULL
         ORDER BY created_at DESC
         LIMIT 1`,
        [params.user_id, params.lesson_id]
      );
    } else {
      return { hasAttempt: false, canRetake: true, submission: null };
    }

    const row = result.rows[0];
    if (!row) return { hasAttempt: false, canRetake: true, submission: null };
    return {
      hasAttempt: true,
      canRetake: Boolean(row.retake_allowed),
      submission: row,
    };
  }

  static async create(data: {
    user_id: number;
    lesson_id?: number | null;
    section_id?: number | null;
    score: number;
    total_questions: number;
    answers: any[];
  }) {
    if (!data.lesson_id && !data.section_id) {
      throw new Error('lesson_id yoki section_id kerak');
    }

    const status = await this.getAttemptStatus({
      user_id: data.user_id,
      lesson_id: data.lesson_id,
      section_id: data.section_id,
    });

    if (status.hasAttempt && !status.canRetake) {
      throw new Error("Bu testni allaqachon ishlagansiz. Qayta ishlash uchun admin ruxsati kerak.");
    }

    // Yangi urinish — eski retake flagni o'chiramiz
    if (status.submission?.id) {
      await pool.query(
        `UPDATE test_submissions SET retake_allowed = FALSE WHERE id = $1`,
        [status.submission.id]
      );
    }

    const result = await pool.query(`
      INSERT INTO test_submissions (user_id, lesson_id, section_id, score, total_questions, answers, retake_allowed)
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
      RETURNING *
    `, [
      data.user_id,
      data.lesson_id || null,
      data.section_id || null,
      data.score,
      data.total_questions,
      JSON.stringify(data.answers),
    ]);
    return result.rows[0];
  }

  static async allowRetake(submissionId: number) {
    const result = await pool.query(
      `UPDATE test_submissions SET retake_allowed = TRUE WHERE id = $1 RETURNING *`,
      [submissionId]
    );
    return result.rows[0] || null;
  }

  static async delete(submissionId: number) {
    const result = await pool.query(
      `DELETE FROM test_submissions WHERE id = $1 RETURNING id`,
      [submissionId]
    );
    return result.rows[0] || null;
  }

  static async findDetailedById(id: number) {
    const result = await pool.query(`
      SELECT ts.*,
        u.first_name, u.last_name, u.email,
        COALESCE(l.title, CASE WHEN ts.section_id IS NOT NULL THEN ls2.name || ' (bo''lim testi)' ELSE NULL END) as lesson_title,
        COALESCE(ls.name, ls2.name) as section_name,
        COALESCE(t.name, t2.name) as tariff_name
      FROM test_submissions ts
      JOIN users u ON u.id = ts.user_id
      LEFT JOIN lessons l ON l.id = ts.lesson_id
      LEFT JOIN lesson_sections ls ON ls.id = l.section_id
      LEFT JOIN tariffs t ON t.id = l.tariff_id
      LEFT JOIN lesson_sections ls2 ON ls2.id = ts.section_id
      LEFT JOIN tariffs t2 ON t2.id = ls2.tariff_id
      WHERE ts.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  static async findAllDetailed() {
    const result = await pool.query(`
      SELECT ts.*,
        u.first_name, u.last_name, u.email,
        COALESCE(l.title, CASE WHEN ts.section_id IS NOT NULL THEN ls2.name || ' (bo''lim testi)' ELSE NULL END) as lesson_title,
        COALESCE(ls.name, ls2.name) as section_name,
        COALESCE(t.name, t2.name) as tariff_name
      FROM test_submissions ts
      JOIN users u ON u.id = ts.user_id
      LEFT JOIN lessons l ON l.id = ts.lesson_id
      LEFT JOIN lesson_sections ls ON ls.id = l.section_id
      LEFT JOIN tariffs t ON t.id = l.tariff_id
      LEFT JOIN lesson_sections ls2 ON ls2.id = ts.section_id
      LEFT JOIN tariffs t2 ON t2.id = ls2.tariff_id
      ORDER BY ts.created_at DESC
    `);
    return result.rows;
  }

  static async findAll() {
    return this.findAllDetailed();
  }

  static async findByLesson(lessonId: number) {
    const result = await pool.query(
      'SELECT * FROM test_submissions WHERE lesson_id = $1 ORDER BY created_at DESC',
      [lessonId]
    );
    return result.rows;
  }

  static async findByUser(userId: number) {
    const result = await pool.query(
      'SELECT * FROM test_submissions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }
}

type RatingPeriod = 'today' | 'week' | 'last_week';

interface RawSubmission {
  user_id: number;
  first_name: string;
  last_name: string;
  lesson_id: number;
  lesson_title: string;
  lesson_order: number;
  section_id: number | null;
  tariff_id?: number;
  score: number;
  total_questions: number;
}

function getPeriodBounds(period: RatingPeriod): { start: Date; end: Date; label: string } {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(now);

  if (period === 'today') {
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    return { start: today, end, label: 'Bugun' };
  }

  const day = today.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - diffToMonday);

  if (period === 'week') {
    const end = new Date(today);
    end.setDate(end.getDate() + 1);
    return { start: thisMonday, end, label: 'Haftalik' };
  }

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  return { start: lastMonday, end: thisMonday, label: "O'tgan hafta" };
}

function toRatingEntries(
  rows: Array<{ user_id: number; first_name: string; last_name: string; score: number; total_questions: number; tests_count?: number }>
): RatingEntry[] {
  const sorted = [...rows].sort((a, b) => {
    const countA = a.tests_count || 1;
    const countB = b.tests_count || 1;
    if (countB !== countA) return countB - countA;
    const pctA = a.total_questions > 0 ? a.score / a.total_questions : 0;
    const pctB = b.total_questions > 0 ? b.score / b.total_questions : 0;
    if (pctB !== pctA) return pctB - pctA;
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });

  return sorted.map((row, index) => {
    const percentage = row.total_questions > 0
      ? Math.round((row.score * 1000) / row.total_questions) / 10
      : 0;
    return {
      rank: index + 1,
      user_id: row.user_id,
      first_name: row.first_name,
      last_name: row.last_name,
      full_name: `${row.first_name} ${row.last_name}`.trim(),
      score: row.score,
      total_questions: row.total_questions,
      percentage,
      is_perfect: percentage === 100 && row.total_questions > 0,
      tests_count: row.tests_count || 1,
    };
  });
}

function aggregateSubmissions(submissions: RawSubmission[]) {
  const byUser = new Map<number, { user_id: number; first_name: string; last_name: string; score: number; total_questions: number; tests_count: number }>();
  for (const s of submissions) {
    const existing = byUser.get(s.user_id);
    if (existing) {
      existing.score += s.score;
      existing.total_questions += s.total_questions;
      existing.tests_count += 1;
    } else {
      byUser.set(s.user_id, {
        user_id: s.user_id,
        first_name: s.first_name,
        last_name: s.last_name,
        score: s.score,
        total_questions: s.total_questions,
        tests_count: 1,
      });
    }
  }
  return toRatingEntries(Array.from(byUser.values()));
}

export class RatingService {
  static async fetchSubmissions(period: RatingPeriod, tariffId?: number | null) {
    const { start, end } = getPeriodBounds(period);
    const params: unknown[] = [start.toISOString(), end.toISOString()];
    let tariffFilter = '';

    if (tariffId) {
      tariffFilter = 'AND l.tariff_id = $3';
      params.push(tariffId);
    }

    const submissionsResult = await pool.query(`
      SELECT 
        ts.user_id, ts.lesson_id, ts.score, ts.total_questions,
        u.first_name, u.last_name,
        l.title as lesson_title, l.section_id, l.order_number as lesson_order,
        l.tariff_id
      FROM test_submissions ts
      JOIN users u ON u.id = ts.user_id
      JOIN lessons l ON l.id = ts.lesson_id
      WHERE ts.created_at >= $1 AND ts.created_at < $2
        ${tariffFilter}
      ORDER BY ts.created_at DESC
    `, params);

    return submissionsResult.rows as RawSubmission[];
  }

  static async getLeaderboard(period: RatingPeriod, tariffId?: number | null) {
    const { label } = getPeriodBounds(period);
    const globalSubmissions = await this.fetchSubmissions(period);
    const overallLeaderboard = aggregateSubmissions(globalSubmissions);

    let sections: Array<{
      id: number;
      name: string;
      order_number: number;
      leaderboard: RatingEntry[];
      lessons: Array<{ id: number; title: string; order_number: number; leaderboard: RatingEntry[] }>;
    }> = [];
    let tariffName = 'Barcha foydalanuvchilar';

    if (tariffId) {
      const tariff = await TariffService.findById(tariffId);
      tariffName = tariff?.name || 'Tarif';
      const tariffSubmissions = globalSubmissions.filter((s) => s.tariff_id === tariffId);
      const sectionRows = await SectionService.findAllWithLessonsByTariff(tariffId);

      sections = sectionRows.map((section) => {
        const sectionSubmissions = tariffSubmissions.filter((s) => s.section_id === section.id);
        const lessonsWithRatings = (section.lessons || [])
          .filter((lesson) => {
            const hasTest = Array.isArray(lesson.test_questions) && lesson.test_questions.length > 0;
            const hasSubmissions = tariffSubmissions.some((s) => s.lesson_id === lesson.id);
            return hasTest || hasSubmissions;
          })
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            order_number: lesson.order_number,
            leaderboard: aggregateSubmissions(tariffSubmissions.filter((s) => s.lesson_id === lesson.id)),
          }));

        return {
          id: section.id,
          name: section.name,
          order_number: section.order_number,
          leaderboard: aggregateSubmissions(sectionSubmissions),
          lessons: lessonsWithRatings,
        };
      });
    }

    return {
      period,
      period_label: label,
      tariff_id: tariffId || null,
      tariff_name: tariffName,
      overall_leaderboard: overallLeaderboard,
      tariff_leaderboard: overallLeaderboard,
      sections,
      total_submissions: globalSubmissions.length,
    };
  }
}

export default pool;
