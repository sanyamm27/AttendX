import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { student_id, subject_code } = await req.json();

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    let subject = await db.getSubjectById(params.id);
    if (!subject && subject_code) {
      subject = await db.getSubjectByCode(subject_code);
    }

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const enrollment = await db.enrollStudent(subject.subject_id, student_id);

    return NextResponse.json({
      success: true,
      enrollment,
      subject: {
        subject_id: subject.subject_id,
        name: subject.name,
        subject_code: subject.subject_code,
        section: subject.section,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
