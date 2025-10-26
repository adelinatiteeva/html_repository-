import SelfReportForm from '@/components/forms/self-report-form';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SelfReportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/signin');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Daily self-report</h1>
        <p className="text-muted-foreground">Share how you&apos;re feeling to unlock new mission insights.</p>
      </div>
      <SelfReportForm userId={user.id} />
    </div>
  );
}
