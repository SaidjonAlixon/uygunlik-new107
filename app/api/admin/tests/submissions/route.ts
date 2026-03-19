import { NextRequest, NextResponse } from 'next/server';
import { TestSubmissionService, initializeDatabase } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    const submissions = await TestSubmissionService.findAll();
    return NextResponse.json(submissions, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
