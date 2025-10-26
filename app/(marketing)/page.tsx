import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MarketingPage() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 py-16 text-center">
      <div className="space-y-4">
        <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">Mission Control</span>
        <h1 className="text-4xl font-bold sm:text-5xl">Self-reporting, exchanges, and rewards without friction</h1>
        <p className="text-lg text-muted-foreground">
          Track wellness data, exchange insights with teammates, and redeem perks — all from a single, secure workspace.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/signin">Get Started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">View Dashboard</Link>
        </Button>
      </div>
    </section>
  );
}
