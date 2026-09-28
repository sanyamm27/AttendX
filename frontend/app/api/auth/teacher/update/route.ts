import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('attendx_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthenticated session.' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie);
    if (session.role !== 'teacher' || !session.id) {
      return NextResponse.json({ error: 'Unauthorized teacher access.' }, { status: 403 });
    }

    const { name, password } = await req.json();

    const updates: { name?: string; password_hash?: string } = {};
    if (name && name.trim()) {
      updates.name = name.trim();
    }
    if (password && password.trim()) {
      updates.password_hash = await bcrypt.hash(password.trim(), 10);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No update fields provided.' }, { status: 400 });
    }

    const updatedTeacher = await db.updateTeacher(session.id, updates);

    const response = NextResponse.json({
      success: true,
      teacher: {
        teacher_id: updatedTeacher.teacher_id,
        username: updatedTeacher.username,
        name: updatedTeacher.name,
      },
      message: 'Profile updated successfully.',
    });

    // Update session cookie if name changed
    if (updates.name) {
      response.cookies.set('attendx_session', JSON.stringify({
        ...session,
        name: updatedTeacher.name,
      }), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
