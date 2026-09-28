import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const teacher = await db.getTeacherByUsername(username);
    if (!teacher) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, teacher.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      teacher: {
        teacher_id: teacher.teacher_id,
        username: teacher.username,
        name: teacher.name,
      },
    });

    // Set session cookie
    response.cookies.set('attendx_session', JSON.stringify({
      role: 'teacher',
      id: teacher.teacher_id,
      name: teacher.name,
      username: teacher.username,
    }), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
