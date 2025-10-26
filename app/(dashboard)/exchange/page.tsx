import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ExchangeList from '@/components/dashboard/exchange-list';

export default async function ExchangePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }

  const exchanges = await prisma.exchange.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { partner: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Exchange Center</h1>
        <p className="text-muted-foreground">Review active collaboration exchanges with your peers.</p>
      </div>
      <ExchangeList exchanges={exchanges} />
    </div>
  );
}
