import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

interface DashboardOverviewProps {
  userId: string;
}

export default async function DashboardOverview({ userId }: DashboardOverviewProps) {
  const [latestReport, exchanges, redemptions] = await Promise.all([
    prisma.selfReport.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.exchange.count({ where: { userId } }),
    prisma.redemption.count({ where: { userId } }),
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Latest Self-report</h3>
        {latestReport ? (
          <p className="mt-2 text-lg font-semibold">{format(latestReport.createdAt, 'PP')}</p>
        ) : (
          <p className="mt-2 text-muted-foreground">No reports yet</p>
        )}
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Exchanges</h3>
        <p className="mt-2 text-3xl font-bold">{exchanges}</p>
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-muted-foreground">Rewards Redeemed</h3>
        <p className="mt-2 text-3xl font-bold">{redemptions}</p>
      </div>
    </div>
  );
}
