import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const subjectId = params.id;
    const subject = await db.getSubjectById(subjectId);

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const qrDataUrl = await QRCode.toDataURL(subject.subject_code, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({
      subject_id: subject.subject_id,
      subject_code: subject.subject_code,
      qr_code: qrDataUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
