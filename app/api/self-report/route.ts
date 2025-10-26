import { NextResponse } from 'next/server';
import { createSelfReport } from '@/lib/actions/self-report';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const result = await createSelfReport({
    userId: user.id,
    mood: payload.mood,
    energy: Number(payload.energy),
    notes: payload.notes,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
