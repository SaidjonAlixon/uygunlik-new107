import { NextRequest, NextResponse } from 'next/server';
import { VideoService, initializeDatabase } from '@/lib/postgres';

export async function GET() {
  try {
    await initializeDatabase();
    const videos = await VideoService.findAll();
    return NextResponse.json(videos, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();
    // JSON metadata qabul qilamiz: { title, description, filename, url }
    const body = await request.json();
    const { title, description, filename, url } = body || {};

    if (!title) {
      return NextResponse.json({ error: 'title kerak' }, { status: 400 });
    }

    const safeFilename = filename || `video_${Date.now()}.mp4`;
    
    // Agar URL kiritilgan bo'lsa (Google Drive), uni ishlatamiz
    // Aks holda local upload URL
    const videoUrl = url || `/uploads/${safeFilename}`;

    const video = await VideoService.create({
      title,
      description: description || '',
      filename: safeFilename,
      url: videoUrl,
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
