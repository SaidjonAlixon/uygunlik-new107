import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserService, initializeDatabase } from '@/lib/postgres';
import { createToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();
    
    const body = await request.json();
    const { first_name, last_name, email, password } = body;

    // Validation
    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: 'Barcha maydonlar to\'ldirilishi kerak' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Parol kamida 4 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Noto\'g\'ri email formati' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email bilan foydalanuvchi allaqachon mavjud' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await UserService.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role: 'user',
      status: true
    });

    // Debug: log user creation
    console.log('User created:', newUser);

    // Create JWT token
    const token = createToken({ id: newUser.id, email: newUser.email });

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { 
        user: userWithoutPassword, 
        token,
        message: 'Foydalanuvchi muvaffaqiyatli yaratildi' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Server xatoligi yuz berdi' },
      { status: 500 }
    );
  }
}
