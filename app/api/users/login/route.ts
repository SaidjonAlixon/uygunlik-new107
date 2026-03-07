import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserService, initializeDatabase } from '@/lib/postgres';
import { createToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol kiritilishi kerak' },
        { status: 400 }
      );
    }

    // Debug: log login attempt
    console.log('Login attempt for email:', email);

    // Find user by email
    const user = await UserService.findByEmail(email);
    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json(
        { error: 'Noto\'g\'ri email yoki parol' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri email yoki parol' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.status) {
      return NextResponse.json(
        { error: 'Hisobingiz faol emas' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken({ id: user.id, email: user.email });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        user: userWithoutPassword, 
        token,
        message: 'Muvaffaqiyatli kirildi' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server xatoligi yuz berdi' },
      { status: 500 }
    );
  }
}
