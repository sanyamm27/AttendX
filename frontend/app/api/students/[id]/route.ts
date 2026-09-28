import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string | null;
    const file = formData.get('photo') as File | null;

    const updates: { name?: string; face_embedding?: number[] } = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    let isMock = false;

    if (file) {
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
      const embedding: number[] = embedData.embedding || [];
      isMock = embedData.mock || false;

      if (!embedding || embedding.length !== 128) {
        return NextResponse.json(
          { error: 'No face detected in photo. Please upload a clear face photo.' },
          { status: 400 }
        );
      }

      updates.face_embedding = embedding;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No update fields provided.' }, { status: 400 });
    }

    const updatedStudent = await db.updateStudent(studentId, updates);

    return NextResponse.json({
      success: true,
      student: {
        student_id: updatedStudent.student_id,
        name: updatedStudent.name,
        face_embedding: updatedStudent.face_embedding,
        created_at: updatedStudent.created_at,
      },
      mock: isMock,
      message: 'Student profile & face embedding updated successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    await db.deleteStudent(studentId);
    return NextResponse.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
