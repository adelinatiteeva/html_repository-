import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import RedeemList from '@/components/dashboard/redeem-list';

export default async function RedeemPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }

  const rewards = await prisma.reward.findMany({
    include: {
      redemptions: { where: { userId: user.id } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Redeem Rewards</h1>
        <p className="text-muted-foreground">Redeem your mission points for perks curated by the operations team.</p>
      </div>
      <RedeemList rewards={rewards} userId={user.id} />
    </div>
  );
}
