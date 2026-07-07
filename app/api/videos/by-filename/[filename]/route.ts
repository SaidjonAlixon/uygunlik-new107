import { NextRequest, NextResponse } from 'next/server';
import { VideoService, initializeDatabase } from '@/lib/postgres';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    await initializeDatabase();
    const { filename } = await params;
    
    // Avval filename bo'yicha qidirish
    let video = await VideoService.findByFilename(filename);
    
    // Agar topilmasa, URL bo'yicha qidirish (Google Drive uchun)
    if (!video && filename.includes('drive.google.com')) {
      video = await VideoService.findByUrl(filename);
    }
    
    // Agar hali ham topilmasa, barcha videolarni ko'rib, Google Drive URL'ga ega videoni topish
    if (!video) {
      const allVideos = await VideoService.findAll();
      video = allVideos.find(v => 
        v.url && (
          v.url.includes(filename) || 
          filename.includes('preview') && v.url.includes('drive.google.com')
        )
      ) || null;
    }
    
    if (!video) {
      return NextResponse.json({ error: 'Video topilmadi' }, { status: 404 });
    }

    return NextResponse.json(video, { status: 200 });
  } catch (error: any) {
    console.error('Video by filename error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
