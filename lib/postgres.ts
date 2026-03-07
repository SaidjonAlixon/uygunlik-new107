import { Pool } from 'pg';

// PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Database connection status
let isDatabaseInitialized = false;

// Database schema initialization
export async function initializeDatabase() {
  if (isDatabaseInitialized) {
    return; // Already initialized
  }

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

    // Add tariff_id column if it doesn't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'tariff_id'
        ) THEN
          ALTER TABLE users ADD COLUMN tariff_id INTEGER REFERENCES tariffs(id) ON DELETE SET NULL;
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
      CREATE TABLE IF NOT EXISTS lesson_progress (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, lesson_id)
      )
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

    isDatabaseInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error);
    throw new Error(`Failed to connect to PostgreSQL database: ${error.message}. Please check your DATABASE_URL environment variable.`);
  }
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
      INSERT INTO users (first_name, last_name, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
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
    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

  static async update(id: number, updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: boolean;
    tariff_id?: number;
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

    return result.rows[0] || null;
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

// Lesson operations
export class LessonService {
  static async findAllByTariff(tariffId: number) {
    const result = await pool.query(`
      SELECT * FROM lessons 
      WHERE tariff_id = $1 
      ORDER BY order_number ASC, created_at ASC
    `, [tariffId]);
    return result.rows;
  }

  static async findById(id: number) {
    const result = await pool.query('SELECT * FROM lessons WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(lessonData: {
    tariff_id: number;
    title: string;
    description?: string;
    video_url?: string;
    pdf_url?: string;
    order_number?: number;
    additional_resources?: any[];
  }) {
    const result = await pool.query(`
      INSERT INTO lessons (tariff_id, title, description, video_url, pdf_url, order_number, additional_resources)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      lessonData.tariff_id,
      lessonData.title,
      lessonData.description || '',
      lessonData.video_url || '',
      lessonData.pdf_url || '',
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
    order_number?: number;
    additional_resources?: any[];
  }) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'additional_resources') {
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

    const query = `UPDATE lessons SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: number) {
    const result = await pool.query('DELETE FROM lessons WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
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

export default pool;
