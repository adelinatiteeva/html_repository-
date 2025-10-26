'use client';

import type { Reward, Redemption } from '@prisma/client';
import { useTransition } from 'react';
import { redeemReward } from '@/lib/actions/reward';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface RewardWithRedemptions extends Reward {
  redemptions: Redemption[];
}

interface RedeemListProps {
  rewards: RewardWithRedemptions[];
  userId: string;
}

export default function RedeemList({ rewards, userId }: RedeemListProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const onRedeem = (rewardId: string) => {
    startTransition(async () => {
      const result = await redeemReward({ rewardId, userId });
      if (!result.success) {
        toast({ title: 'Unable to redeem', description: result.message, variant: 'destructive' });
      } else {
        toast({ title: 'Reward redeemed', description: 'Enjoy your perk!' });
      }
    });
  };

  if (!rewards.length) {
    return <p className="text-muted-foreground">No rewards available yet.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rewards.map((reward) => {
        const alreadyRedeemed = reward.redemptions.some((r) => r.userId === userId);
        return (
          <article key={reward.id} className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold">{reward.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{reward.description}</p>
            <p className="mt-3 text-sm font-medium">Cost: {reward.cost} pts</p>
            <Button
              className="mt-4 w-full"
              onClick={() => onRedeem(reward.id)}
              disabled={pending || alreadyRedeemed}
            >
              {alreadyRedeemed ? 'Redeemed' : 'Redeem reward'}
            </Button>
          </article>
        );
      })}
    </div>
  );
}
