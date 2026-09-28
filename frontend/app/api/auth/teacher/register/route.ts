import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password, name } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Username, password, and name are required.' },
        { status: 400 }
      );
    }

    // Check if teacher already exists
    const existing = await db.getTeacherByUsername(username);
    if (existing) {
      return NextResponse.json(
        { error: 'Username is already taken.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);
    const teacher = await db.createTeacher(username, password_hash, name);

    return NextResponse.json({
      success: true,
      teacher: {
        teacher_id: teacher.teacher_id,
        username: teacher.username,
        name: teacher.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
