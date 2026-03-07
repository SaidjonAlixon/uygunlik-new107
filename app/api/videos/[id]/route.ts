import { NextRequest, NextResponse } from 'next/server';
import { VideoService, initializeDatabase } from '@/lib/postgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const body = await request.json();
    const { title, description } = body;
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri video ID' }, { status: 400 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const updatedVideo = await VideoService.update(videoId, updates);
    
    if (!updatedVideo) {
      return NextResponse.json({ error: 'Video topilmadi' }, { status: 404 });
    }

    return NextResponse.json(updatedVideo, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Noto\'g\'ri video ID' }, { status: 400 });
    }

    const deletedVideo = await VideoService.delete(videoId);
    
    if (!deletedVideo) {
      return NextResponse.json({ error: 'Video topilmadi' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Video muvaffaqiyatli o\'chirildi' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
