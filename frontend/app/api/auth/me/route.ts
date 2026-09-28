import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('attendx_session');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let session: any;
    try {
      const decoded = decodeURIComponent(sessionCookie.value);
      session = JSON.parse(decoded);
    } catch {
      try {
        session = JSON.parse(sessionCookie.value);
      } catch {
        return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      }
    }

    if (!session || typeof session !== 'object') {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    if (session.role === 'student' && session.id) {
      const student = await db.getStudentById(session.id);
      return NextResponse.json({
        authenticated: true,
        user: {
          role: 'student',
          id: session.id,
          name: student?.name || session.name || 'Student',
          created_at: student?.created_at,
        },
      });
    }

    if (session.role === 'teacher' && session.id) {
      const teacher = await db.getTeacherById(session.id) || (session.username ? await db.getTeacherByUsername(session.username) : null);
      return NextResponse.json({
        authenticated: true,
        user: {
          role: 'teacher',
          id: session.id,
          name: teacher?.name || session.name || 'Teacher',
          username: teacher?.username || session.username || '',
        },
      });
    }

    return NextResponse.json({ authenticated: true, user: session });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
