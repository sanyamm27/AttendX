import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ATTENDANCE_COMPLIANCE_THRESHOLD } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject_id = searchParams.get('subject_id') || undefined;

    // Retrieve raw attendance logs (read-only query)
    const logs = await db.getAttendanceLogs(subject_id);

    const total_logs = logs.length;
    const present_count = logs.filter((l) => l.is_present).length;
    const absent_count = logs.filter((l) => !l.is_present).length;
    const present_rate = total_logs > 0 ? Number(((present_count / total_logs) * 100).toFixed(1)) : 0;

    // Group logs by UTC calendar day (YYYY-MM-DD)
    const dateMap = new Map<string, { present: number; total: number }>();
    logs.forEach((log) => {
      const dateStr = new Date(log.timestamp).toISOString().slice(0, 10);
      const current = dateMap.get(dateStr) || { present: 0, total: 0 };
      current.total += 1;
      if (log.is_present) {
        current.present += 1;
      }
      dateMap.set(dateStr, current);
    });

    const daily_trends = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        present_count: counts.present,
        total_logs: counts.total,
        rate: counts.total > 0 ? Number(((counts.present / counts.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Mode distribution (face vs qr)
    const faceCount = logs.filter((l) => l.method === 'face').length;
    const qrCount = logs.filter((l) => l.method === 'qr').length;
    const facePercentage = total_logs > 0 ? Number(((faceCount / total_logs) * 100).toFixed(1)) : 0;
    const qrPercentage = total_logs > 0 ? Number(((qrCount / total_logs) * 100).toFixed(1)) : 0;

    // Low attendance student calculation (students with rate < ATTENDANCE_COMPLIANCE_THRESHOLD%)
    const studentMap = new Map<string, { present: number; total: number }>();
    logs.forEach((log) => {
      const current = studentMap.get(log.student_id) || { present: 0, total: 0 };
      current.total += 1;
      if (log.is_present) {
        current.present += 1;
      }
      studentMap.set(log.student_id, current);
    });

    const low_attendance_students = [];
    for (const [sId, counts] of Array.from(studentMap.entries())) {
      const rate = counts.total > 0 ? (counts.present / counts.total) * 100 : 0;
      if (rate < ATTENDANCE_COMPLIANCE_THRESHOLD) {
        const student = await db.getStudentById(sId);
        low_attendance_students.push({
          student_id: sId,
          name: student?.name || 'Unknown Student',
          rate: Number(rate.toFixed(1)),
          total_logs: counts.total,
          present_count: counts.present,
        });
      }
    }

    return NextResponse.json({
      success: true,
      analytics: {
        total_logs,
        present_count,
        absent_count,
        present_rate,
        daily_trends,
        mode_distribution: {
          face: faceCount,
          qr: qrCount,
          total: total_logs,
          face_percentage: facePercentage,
          qr_percentage: qrPercentage,
        },
        low_attendance_students,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
