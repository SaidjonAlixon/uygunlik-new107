import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { stat } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const filePath = join(process.cwd(), 'public', 'uploads', filename);

    // Fayl mavjudligini tekshirish
    try {
      await stat(filePath);
    } catch {
      return NextResponse.json({ error: 'Video topilmadi' }, { status: 404 });
    }

    // Faylni o'qish
    const fileBuffer = await readFile(filePath);
    
    // Content-Type'ni aniqlash
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'video/mp4';
    if (ext === 'webm') contentType = 'video/webm';
    if (ext === 'avi') contentType = 'video/x-msvideo';
    if (ext === 'mov') contentType = 'video/quicktime';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error: any) {
    console.error('Video stream error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
