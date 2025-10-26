'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  userId: z.string().cuid(),
  mood: z.string().min(1),
  energy: z.number().min(1).max(10),
  notes: z.string().optional(),
});

export async function createSelfReport(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: 'Invalid payload' } as const;
  }

  await prisma.selfReport.create({ data: parsed.data });
  revalidatePath('/dashboard');
  revalidatePath('/self-report');

  return { success: true } as const;
}
