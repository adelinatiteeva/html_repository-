'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  rewardId: z.string().cuid(),
  userId: z.string().cuid(),
});

export async function redeemReward(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: 'Invalid payload' } as const;
  }

  const { rewardId, userId } = parsed.data;

  const alreadyRedeemed = await prisma.redemption.findFirst({ where: { rewardId, userId } });
  if (alreadyRedeemed) {
    return { success: false, message: 'Already redeemed' } as const;
  }

  await prisma.redemption.create({ data: { rewardId, userId } });
  revalidatePath('/redeem');
  revalidatePath('/dashboard');

  return { success: true } as const;
}
