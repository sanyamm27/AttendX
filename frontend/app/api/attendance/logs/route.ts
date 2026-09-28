import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject_id = searchParams.get('subject_id') || undefined;
    const student_id = searchParams.get('student_id') || undefined;

    const logs = await db.getAttendanceLogs(subject_id, student_id);

    // Enrich logs with student name and subject name
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const student = await db.getStudentById(log.student_id);
        const subject = await db.getSubjectById(log.subject_id);
        return {
          ...log,
          student_name: student?.name || 'Unknown Student',
          subject_name: subject?.name || 'Unknown Subject',
          subject_code: subject?.subject_code || '',
        };
      })
    );

    return NextResponse.json({ success: true, logs: enrichedLogs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
