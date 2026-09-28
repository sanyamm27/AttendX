import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Mode 1: Confirm & Save reviewed attendance
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { confirm, subject_id, reviewed_students } = body;

      if (confirm) {
        if (!subject_id) {
          return NextResponse.json({ error: 'subject_id is required for confirmation.' }, { status: 400 });
        }
        if (!Array.isArray(reviewed_students)) {
          return NextResponse.json({ error: 'reviewed_students array is required for confirmation.' }, { status: 400 });
        }

        const createdLogs = [];
        for (const student of reviewed_students) {
          if (!student.student_id) continue;
          const log = await db.createAttendanceLog(
            student.student_id,
            subject_id,
            'face',
            !!student.is_present
          );
          createdLogs.push(log);
        }

        return NextResponse.json({
          success: true,
          preview: false,
          subject_id,
          logs: createdLogs,
          matched_count: createdLogs.filter((l) => l.is_present).length,
          message: 'Attendance reviewed and saved successfully.',
        });
      }
    }

    // Mode 2: Preview / Review Face Recognition (FormData upload)
    const formData = await req.formData();
    const isConfirmForm = formData.get('confirm') === 'true';
    const subject_id = formData.get('subject_id') as string;

    if (isConfirmForm) {
      const reviewedStudentsJson = formData.get('reviewed_students') as string;
      const reviewedStudents = reviewedStudentsJson ? JSON.parse(reviewedStudentsJson) : [];
      
      const createdLogs = [];
      for (const student of reviewedStudents) {
        if (!student.student_id) continue;
        const log = await db.createAttendanceLog(
          student.student_id,
          subject_id,
          'face',
          !!student.is_present
        );
        createdLogs.push(log);
      }

      return NextResponse.json({
        success: true,
        preview: false,
        subject_id,
        logs: createdLogs,
        matched_count: createdLogs.filter((l) => l.is_present).length,
        message: 'Attendance reviewed and saved successfully.',
      });
    }

    const photo = formData.get('photo') as File | null;
    const photo_b64 = formData.get('photo_b64') as string | null;

    if (!subject_id) {
      return NextResponse.json({ error: 'subject_id is required.' }, { status: 400 });
    }

    if (!photo && !photo_b64) {
      return NextResponse.json({ error: 'Classroom photo is required.' }, { status: 400 });
    }

    // Get enrolled students for this subject
    let enrolledStudents = await db.getEnrolledStudents(subject_id);
    
    // If no students explicitly enrolled in join table yet, fall back to all registered students
    if (enrolledStudents.length === 0) {
      enrolledStudents = await db.getAllStudents();
    }

    if (enrolledStudents.length === 0) {
      return NextResponse.json({
        success: false,
        preview: true,
        message: 'No registered students available for attendance matching.',
        matched_student_ids: [],
        students: [],
        logs: [],
      });
    }

    let b64 = photo_b64;
    if (!b64 && photo) {
      const buffer = await photo.arrayBuffer();
      b64 = Buffer.from(buffer).toString('base64');
    }

    // Prepare payload for FastAPI face microservice /match
    const fastApiPayload = {
      classroom_photo_b64: b64,
      students: enrolledStudents.map((s) => ({
        student_id: s.student_id,
        name: s.name,
        face_embedding: s.face_embedding,
      })),
    };

    const fastApiRes = await fetch('http://localhost:8000/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fastApiPayload),
    });

    if (!fastApiRes.ok) {
      const errText = await fastApiRes.text();
      return NextResponse.json(
        { error: `Face matching microservice error: ${errText}` },
        { status: 502 }
      );
    }

    const matchResult = await fastApiRes.json();
    const matchedIds: string[] = matchResult.matched_student_ids || [];

    // Construct roster review array without saving to DB yet
    const reviewRoster = enrolledStudents.map((student) => ({
      student_id: student.student_id,
      name: student.name,
      is_present: matchedIds.includes(student.student_id),
    }));

    return NextResponse.json({
      success: true,
      preview: true,
      subject_id,
      matched_student_ids: matchedIds,
      matched_count: matchedIds.length,
      detections_count: matchResult.detections_count || 0,
      mock: matchResult.mock || false,
      matches: matchResult.matches || [],
      students: reviewRoster,
      message: matchResult.message || 'Face detection complete. Please review attendance roster before saving.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
