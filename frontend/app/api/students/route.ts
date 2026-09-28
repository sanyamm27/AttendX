import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const students = await db.getAllStudents();
    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const file = formData.get('photo') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Student name is required.' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Face photo is required for student registration.' },
        { status: 400 }
      );
    }

    const fastApiFormData = new FormData();
    fastApiFormData.append('file', file);

    const fastApiRes = await fetch('http://localhost:8000/embed', {
      method: 'POST',
      body: fastApiFormData,
    });

    if (!fastApiRes.ok) {
      return NextResponse.json(
        { error: 'Face microservice embedding failed.' },
        { status: 502 }
      );
    }

    const embedData = await fastApiRes.json();

    if (embedData.quality_passed === false) {
      return NextResponse.json(
        { error: embedData.message || 'Face photo quality check failed.' },
        { status: 400 }
      );
    }

    const embedding: number[] = embedData.embedding || [];
    const isMock: boolean = embedData.mock || false;

    if (!embedding || embedding.length !== 128) {
      return NextResponse.json(
        { error: embedData.message || 'No face detected in photo. Please upload a clear face photo.' },
        { status: 400 }
      );
    }

    const student = await db.createStudent(name, embedding);

    return NextResponse.json({
      success: true,
      student,
      mock: isMock,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const allStudents = await db.getAllStudents();
    for (const student of allStudents) {
      await db.deleteStudent(student.student_id);
    }
    const { localDb } = await import('@/lib/db');
    localDb.subject_students = [];
    localDb.attendance_logs = [];
    localDb.students = [];
    return NextResponse.json({ success: true, message: 'All student records and enrollments deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
