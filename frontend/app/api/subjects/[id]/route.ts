import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subject = await db.getSubjectById(params.id);
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const enrolled_students = await db.getEnrolledStudents(subject.subject_id);

    return NextResponse.json({
      success: true,
      subject,
      enrolled_students,
      enrolled_count: enrolled_students.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
