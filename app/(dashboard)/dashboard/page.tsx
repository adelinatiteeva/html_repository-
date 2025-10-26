import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import DashboardOverview from '@/components/dashboard/dashboard-overview';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Welcome back, {user.name ?? 'Explorer'}!</h1>
        <p className="text-muted-foreground">Here is a quick snapshot of your mission metrics.</p>
      </header>
      <Suspense fallback={<p>Loading latest insights…</p>}>
        <DashboardOverview userId={user.id} />
      </Suspense>
    </div>
  );
}
