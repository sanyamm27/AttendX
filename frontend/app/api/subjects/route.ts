import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacher_id = searchParams.get('teacher_id') || undefined;
    const student_id = searchParams.get('student_id') || undefined;

    let subjects;
    if (student_id) {
      subjects = await db.getEnrolledSubjects(student_id);
    } else {
      subjects = await db.getSubjects(teacher_id);
    }

    const subjectsWithCount = await Promise.all(
      subjects.map(async (subj) => {
        const enrolled = await db.getEnrolledStudents(subj.subject_id);
        return {
          ...subj,
          enrolled_count: enrolled.length,
        };
      })
    );

    return NextResponse.json({ success: true, subjects: subjectsWithCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, section, teacher_id } = await req.json();

    if (!name || !section) {
      return NextResponse.json(
        { error: 'Subject name and section are required.' },
        { status: 400 }
      );
    }

    let t_id = teacher_id;
    if (!t_id) {
      const sessionCookie = req.cookies.get('attendx_session')?.value;
      if (sessionCookie) {
        try {
          const parsed = JSON.parse(sessionCookie);
          if (parsed.role === 'teacher' && parsed.id) {
            t_id = parsed.id;
          }
        } catch {}
      }
    }
    if (!t_id) {
      t_id = 'default-teacher-id';
    }

    const subject = await db.createSubject(name, section, t_id);

    // Generate static QR code image Data URL for joining
    const qrDataUrl = await QRCode.toDataURL(subject.subject_code, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({
      success: true,
      subject,
      qr_code: qrDataUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
