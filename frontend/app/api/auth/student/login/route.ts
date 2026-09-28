import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo') as File | null;
    const photo_b64 = formData.get('photo_b64') as string | null;

    if (!photo && !photo_b64) {
      return NextResponse.json(
        { error: 'Face photo file or photo_b64 string is required.' },
        { status: 400 }
      );
    }

    // Retrieve all registered students and their face embeddings
    const allStudents = await db.getAllStudents();
    if (allStudents.length === 0) {
      return NextResponse.json({
        matched: false,
        message: 'No students registered in database yet. Please register.',
      });
    }

    let b64 = photo_b64;
    if (!b64 && photo) {
      const buffer = await photo.arrayBuffer();
      b64 = Buffer.from(buffer).toString('base64');
    }

    // Call FastAPI face-service /match
    const fastApiPayload = {
      classroom_photo_b64: b64 || undefined,
      students: allStudents.map((s) => ({
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
        { error: `Face service error: ${errText}` },
        { status: 502 }
      );
    }

    const result = await fastApiRes.json();

    if (result.matched_student_ids && result.matched_student_ids.length > 0) {
      const matchedId = result.matched_student_ids[0];
      const student = await db.getStudentById(matchedId);
      const matchDetail = (result.matches || []).find((m: any) => m.student_id === matchedId);

      const response = NextResponse.json({
        matched: true,
        student: {
          student_id: student?.student_id,
          name: student?.name,
        },
        distance: matchDetail?.distance ?? null,
        matches: result.matches || [],
        mock: result.mock || false,
        message: 'Face recognized successfully.',
      });

      // Set student session cookie
      response.cookies.set('attendx_session', JSON.stringify({
        role: 'student',
        id: student?.student_id,
        name: student?.name,
      }), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json({
      matched: false,
      mock: result.mock || false,
      message: 'Not recognized, register now.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
