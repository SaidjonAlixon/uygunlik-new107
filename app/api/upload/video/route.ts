import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { VideoService, initializeDatabase } from '@/lib/postgres';

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file || !title) {
      return NextResponse.json({ error: 'Fayl va sarlavha kerak' }, { status: 400 });
    }

    // Fayl hajmini tekshirish (5MB limit - Vercel uchun)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Fayl juda katta. Maksimal hajm: 5MB. Iltimos, kichikroq video yuklang.' 
      }, { status: 413 });
    }

    // Fayl nomini xavfsiz qilish
    const timestamp = Date.now();
    const safeFilename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadPath = join(process.cwd(), 'public', 'uploads', safeFilename);

    // Uploads papkasini yaratish
    await mkdir(join(process.cwd(), 'public', 'uploads'), { recursive: true });

    // Faylni saqlash
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(uploadPath, buffer);

    // Database'ga yozish
    const video = await VideoService.create({
      title,
      description: description || '',
      filename: safeFilename,
      url: `/uploads/${safeFilename}`
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error: any) {
    console.error('Video upload error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
