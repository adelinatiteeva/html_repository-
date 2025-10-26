import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  partnerId: z.string().cuid(),
  title: z.string().min(3),
  summary: z.string().min(3),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const exchange = await prisma.exchange.create({
    data: {
      ...parsed.data,
      userId: user.id,
    },
  });

  return NextResponse.json(exchange, { status: 201 });
}
