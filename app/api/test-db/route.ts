import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/postgres';

export async function GET() {
    try {
        await initializeDatabase();
        return NextResponse.json({ status: 'ok', message: 'Database initialized successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Test Init Error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
