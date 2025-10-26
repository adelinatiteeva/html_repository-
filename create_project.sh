#!/usr/bin/env bash
set -euo pipefail

ROOT=${1:-.}
mkdir -p "$ROOT"
cat <<'EOF' > "$ROOT/.env.example"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mission_mvp"
NEXTAUTH_SECRET="change-me"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_example"
STRIPE_WEBHOOK_SECRET="whsec_example"
EOF

cat <<'EOF' > "$ROOT/.eslintrc.js"
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'next/typescript'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'react/jsx-key': 'off'
  }
};
EOF

cat <<'EOF' > "$ROOT/.gitignore"
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/playwright-report
/test-results

# production
/.next
/out

# misc
.DS_Store
*.pem
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# prisma
/prisma/dev.db
EOF

cat <<'EOF' > "$ROOT/README.md"
# Mission Control MVP

A Next.js 14 mission self-reporting platform with App Router, Tailwind CSS, shadcn/ui, Prisma (Postgres), NextAuth, and Stripe integrations.

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Run database migrations and seed data:

```bash
npx prisma migrate deploy
npm run db:seed
```

4. Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with the seeded credentials:

- **Email**: `demo@mission.test`
- **Password**: `password123`

## Prisma workflows

- Generate client: `npx prisma generate`
- Push schema (dev only): `npm run db:push`
- Apply migrations in CI/production: `npm run db:migrate`
- Seed demo data: `npm run db:seed`

## Testing

This project uses Playwright for E2E tests.

```bash
npx playwright install --with-deps
npm run test:e2e
```

The main flow covers login → self-report → exchange → redeem.

## Deployment

1. Provision a Postgres database (e.g., Neon, Supabase, Railway) and update `DATABASE_URL` on Vercel.
2. Set the following environment variables on Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (set to your deployed URL)
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Configure Stripe webhooks to point to your Vercel deployment (e.g., `/api/stripe`).
4. Set the build command to `npm run build` and output directory to `.next` (default).
5. After deployment, run `npx prisma migrate deploy` and `npm run db:seed` via Vercel CLI or a one-off job to ensure the database is ready.

## Regenerating from script

The repository includes a `create_project.sh` script that recreates the full project structure. Run it from an empty directory:

```bash
bash create_project.sh ./mission-control
```

## Sitemap

- `/` — Marketing landing page
- `/signin` — Authentication screen
- `/dashboard` — Mission overview
- `/self-report` — Daily check-in form
- `/exchange` — Collaboration exchanges
- `/redeem` — Rewards catalog
- `/api/*` — Authenticated REST endpoints (self-report, exchange, redeem, stripe)
EOF

mkdir -p "$ROOT/app/(auth)/signin"
cat <<'EOF' > "$ROOT/app/(auth)/signin/page.tsx"
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignInPage() {
  const params = useSearchParams();
  const [email, setEmail] = useState('demo@mission.test');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    await signIn('credentials', {
      email,
      password,
      redirect: true,
      callbackUrl: params.get('callbackUrl') ?? '/dashboard',
    });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-xl border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use the demo credentials to explore the mission.</p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input id="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
EOF

mkdir -p "$ROOT/app/(dashboard)/dashboard"
cat <<'EOF' > "$ROOT/app/(dashboard)/dashboard/page.tsx"
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
EOF

mkdir -p "$ROOT/app/(dashboard)/exchange"
cat <<'EOF' > "$ROOT/app/(dashboard)/exchange/page.tsx"
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
EOF

mkdir -p "$ROOT/app/(dashboard)/redeem"
cat <<'EOF' > "$ROOT/app/(dashboard)/redeem/page.tsx"
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
EOF

mkdir -p "$ROOT/app/(dashboard)/self-report"
cat <<'EOF' > "$ROOT/app/(dashboard)/self-report/page.tsx"
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
EOF

mkdir -p "$ROOT/app/(marketing)"
cat <<'EOF' > "$ROOT/app/(marketing)/page.tsx"
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
EOF

mkdir -p "$ROOT/app/api/auth/[...nextauth]"
cat <<'EOF' > "$ROOT/app/api/auth/[...nextauth]/route.ts"
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
EOF

mkdir -p "$ROOT/app/api/exchange/[id]"
cat <<'EOF' > "$ROOT/app/api/exchange/[id]/route.ts"
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exchange = await prisma.exchange.findFirst({
    where: { id: params.id, userId: user.id },
    include: { partner: true },
  });

  if (!exchange) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(exchange);
}
EOF

mkdir -p "$ROOT/app/api/exchange"
cat <<'EOF' > "$ROOT/app/api/exchange/route.ts"
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
EOF

mkdir -p "$ROOT/app/api/redeem"
cat <<'EOF' > "$ROOT/app/api/redeem/route.ts"
import { NextResponse } from 'next/server';
import { redeemReward } from '@/lib/actions/reward';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const result = await redeemReward({ ...payload, userId: user.id });
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
EOF

mkdir -p "$ROOT/app/api/self-report"
cat <<'EOF' > "$ROOT/app/api/self-report/route.ts"
import { NextResponse } from 'next/server';
import { createSelfReport } from '@/lib/actions/self-report';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  const result = await createSelfReport({
    userId: user.id,
    mood: payload.mood,
    energy: Number(payload.energy),
    notes: payload.notes,
  });
  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
EOF

mkdir -p "$ROOT/app/api/stripe"
cat <<'EOF' > "$ROOT/app/api/stripe/route.ts"
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export async function POST(request: Request) {
  if (!stripeSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
  const payload = await request.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: payload.successUrl ?? 'https://example.com/success',
    cancel_url: payload.cancelUrl ?? 'https://example.com/cancel',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: payload.productName ?? 'Mission Credit Pack' },
          unit_amount: Number(payload.amount ?? 5000),
        },
        quantity: 1,
      },
    ],
  });

  return NextResponse.json({ id: session.id, url: session.url });
}
EOF

mkdir -p "$ROOT/app"
cat <<'EOF' > "$ROOT/app/globals.css"
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply min-h-screen bg-background text-foreground;
  }

  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 47.4% 11.2%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 47.4% 11.2%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 47.4% 11.2%;
    --primary: 239 84% 67%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 239 84% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 239 84% 67%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 239 84% 67%;
  }
}
EOF

mkdir -p "$ROOT/app"
cat <<'EOF' > "$ROOT/app/layout.tsx"
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Providers from '@/components/layout/providers';
import { SiteHeader } from '@/components/layout/site-header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'MVP self-reporting and rewards experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
EOF

mkdir -p "$ROOT/app"
cat <<'EOF' > "$ROOT/app/page.tsx"
export { default } from './(marketing)/page';
EOF

mkdir -p "$ROOT/components/dashboard"
cat <<'EOF' > "$ROOT/components/dashboard/dashboard-overview.tsx"
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
EOF

mkdir -p "$ROOT/components/dashboard"
cat <<'EOF' > "$ROOT/components/dashboard/exchange-list.tsx"
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { Exchange, Partner } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

interface ExchangeWithRelations extends Exchange {
  partner: Partner;
}

interface ExchangeListProps {
  exchanges: ExchangeWithRelations[];
}

export default function ExchangeList({ exchanges }: ExchangeListProps) {
  if (!exchanges.length) {
    return <p className="text-muted-foreground">No exchanges yet. Start a new one from the API.</p>;
  }

  return (
    <ul className="space-y-4">
      {exchanges.map((exchange) => (
        <li key={exchange.id} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{exchange.title}</h3>
              <p className="text-sm text-muted-foreground">with {exchange.partner.name}</p>
            </div>
            <Badge variant={exchange.status === 'COMPLETED' ? 'success' : 'secondary'}>{exchange.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{exchange.summary}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated {formatDistanceToNow(exchange.updatedAt, { addSuffix: true })}</span>
            <Link className="font-medium text-brand" href={`/api/exchange/${exchange.id}`}>
              API details
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
EOF

mkdir -p "$ROOT/components/dashboard"
cat <<'EOF' > "$ROOT/components/dashboard/redeem-list.tsx"
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
EOF

mkdir -p "$ROOT/components/forms"
cat <<'EOF' > "$ROOT/components/forms/self-report-form.tsx"
'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSelfReport } from '@/lib/actions/self-report';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const schema = z.object({
  mood: z.string().min(1, 'Mood is required'),
  energy: z.coerce.number().min(1).max(10),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  userId: string;
}

export default function SelfReportForm({ userId }: Props) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mood: '',
      energy: 5,
      notes: '',
    },
  });
  const [pending, startTransition] = useTransition();

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const { success, message } = await createSelfReport({ ...values, userId });
      if (success) {
        toast({ title: 'Report submitted', description: 'Thanks for checking in today.' });
        reset();
      } else {
        toast({ title: 'Unable to submit', description: message, variant: 'destructive' });
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="mood">
          Mood
        </label>
        <Input id="mood" placeholder="Optimistic" {...register('mood')} />
        {errors.mood && <p className="text-sm text-destructive">{errors.mood.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="energy">
          Energy (1-10)
        </label>
        <Input id="energy" type="number" min={1} max={10} {...register('energy')} />
        {errors.energy && <p className="text-sm text-destructive">{errors.energy.message}</p>}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="notes">
          Mission notes
        </label>
        <Textarea id="notes" rows={4} placeholder="What&apos;s top of mind?" {...register('notes')} />
        {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Submitting…' : 'Submit self-report'}
      </Button>
    </form>
  );
}
EOF

mkdir -p "$ROOT/components/layout"
cat <<'EOF' > "$ROOT/components/layout/providers.tsx"
'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
EOF

mkdir -p "$ROOT/components/layout"
cat <<'EOF' > "$ROOT/components/layout/sign-out-button.tsx"
'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function SignOutButton() {
  return (
    <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
      Sign out
    </Button>
  );
}
EOF

mkdir -p "$ROOT/components/layout"
cat <<'EOF' > "$ROOT/components/layout/site-header.tsx"
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import SignOutButton from '@/components/layout/sign-out-button';
import { Button } from '@/components/ui/button';

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold">
          Mission Control
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/self-report" className="text-muted-foreground hover:text-foreground">
                Self-report
              </Link>
              <Link href="/exchange" className="text-muted-foreground hover:text-foreground">
                Exchange
              </Link>
              <Link href="/redeem" className="text-muted-foreground hover:text-foreground">
                Redeem
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Button asChild>
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
EOF

mkdir -p "$ROOT/components/ui"
cat <<'EOF' > "$ROOT/components/ui/badge.tsx"
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand text-brand-foreground shadow hover:bg-brand/80',
        secondary: 'border-transparent bg-muted text-foreground/80 hover:bg-muted/80',
        success: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
EOF

mkdir -p "$ROOT/components/ui"
cat <<'EOF' > "$ROOT/components/ui/button.tsx"
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand text-brand-foreground shadow hover:bg-brand/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
EOF

mkdir -p "$ROOT/components/ui"
cat <<'EOF' > "$ROOT/components/ui/input.tsx"
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
EOF

mkdir -p "$ROOT/components/ui"
cat <<'EOF' > "$ROOT/components/ui/textarea.tsx"
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
EOF

mkdir -p "$ROOT/components/ui"
cat <<'EOF' > "$ROOT/components/ui/toaster.tsx"
'use client';

import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function Toaster() {
  const { state, dismiss } = useToast();

  useEffect(() => {
    if (state.length) {
      const timer = setTimeout(() => dismiss(state[0].id), 4000);
      return () => clearTimeout(timer);
    }
  }, [state, dismiss]);

  if (!state.length) return null;

  const toast = state[0];

  return (
    <div className="fixed inset-x-0 bottom-4 flex justify-center px-4">
      <div
        className={cn(
          'w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg',
          toast.variant === 'destructive' ? 'border-destructive/50 text-destructive' : 'border-border'
        )}
      >
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        {toast.description && <p className="text-sm text-muted-foreground">{toast.description}</p>}
      </div>
    </div>
  );
}
EOF

mkdir -p "$ROOT/components/ui"
cat <<'EOF' > "$ROOT/components/ui/use-toast.ts"
import * as React from 'react';

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

type ToastActionType = { type: 'ADD_TOAST'; toast: Toast } | { type: 'DISMISS_TOAST'; toastId?: string };

const TOAST_LIMIT = 1;

function addToast(state: Toast[], toast: Toast): Toast[] {
  const existing = state.find((t) => t.id === toast.id);
  if (existing) return state;
  return [...state.slice(-(TOAST_LIMIT - 1)), toast];
}

function toastReducer(state: Toast[], action: ToastActionType): Toast[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return addToast(state, action.toast);
    case 'DISMISS_TOAST':
      if (action.toastId) {
        return state.filter((toast) => toast.id !== action.toastId);
      }
      return [];
    default:
      return state;
  }
}

const ToastContext = React.createContext<{ state: Toast[]; dispatch: React.Dispatch<ToastActionType> } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, []);
  return <ToastContext.Provider value={{ state, dispatch }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  function toast(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    context.dispatch({ type: 'ADD_TOAST', toast: { id, ...toast } });
  }

  function dismiss(toastId?: string) {
    context.dispatch({ type: 'DISMISS_TOAST', toastId });
  }

  return { ...context, toast, dismiss };
}
EOF

mkdir -p "$ROOT/e2e"
cat <<'EOF' > "$ROOT/e2e/mission-flow.spec.ts"
import { test, expect } from '@playwright/test';

test('login → self-report → exchange → redeem', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Get Started' }).click();
  await expect(page).toHaveURL(/signin/);

  await page.getByLabel('Email').fill('demo@mission.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL(/dashboard/);
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

  await page.getByRole('link', { name: 'Self-report' }).click();
  await expect(page).toHaveURL(/self-report/);
  await page.getByLabel('Mood').fill('Focused');
  await page.getByLabel('Energy (1-10)').fill('7');
  await page.getByLabel('Mission notes').fill('Ready to trade insights.');
  await page.getByRole('button', { name: 'Submit self-report' }).click();

  await page.getByRole('link', { name: 'Exchange' }).click();
  await expect(page).toHaveURL(/exchange/);
  await expect(page.getByRole('heading', { name: 'Exchange Center' })).toBeVisible();

  await page.getByRole('link', { name: 'Redeem' }).click();
  await expect(page).toHaveURL(/redeem/);
  await expect(page.getByRole('heading', { name: 'Redeem Rewards' })).toBeVisible();
});
EOF

mkdir -p "$ROOT/lib/actions"
cat <<'EOF' > "$ROOT/lib/actions/reward.ts"
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
EOF

mkdir -p "$ROOT/lib/actions"
cat <<'EOF' > "$ROOT/lib/actions/self-report.ts"
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
EOF

mkdir -p "$ROOT/lib"
cat <<'EOF' > "$ROOT/lib/auth.ts"
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.hashedPassword) {
          return null;
        }
        const valid = await compare(credentials.password, user.hashedPassword);
        if (!valid) {
          return null;
        }
        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
};

export function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  return session?.user ?? null;
}
EOF

mkdir -p "$ROOT/lib"
cat <<'EOF' > "$ROOT/lib/prisma.ts"
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({ log: ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
EOF

mkdir -p "$ROOT/lib"
cat <<'EOF' > "$ROOT/lib/utils.ts"
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF

cat <<'EOF' > "$ROOT/middleware.ts"
export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/self-report/:path*', '/exchange/:path*', '/redeem/:path*'],
};
EOF

cat <<'EOF' > "$ROOT/next-env.d.ts"
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
EOF

cat <<'EOF' > "$ROOT/next.config.mjs"
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
EOF

cat <<'EOF' > "$ROOT/package.json"
{
  "name": "mission-mvp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prepare": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:seed": "ts-node --transpile-only prisma/seed.ts",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@stripe/stripe-js": "^2.3.0",
    "@tanstack/react-query": "^5.51.0",
    "@total-typescript/ts-reset": "^0.5.1",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.390.0",
    "next": "14.2.5",
    "next-auth": "^4.24.7",
    "next-themes": "^0.3.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "^7.51.3",
    "stripe": "^14.25.0",
    "zod": "^3.23.8",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "@radix-ui/react-slot": "^1.0.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "@types/bcryptjs": "^2.4.2",
    "@types/node": "^20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5",
    "postcss": "^8.4.38",
    "prisma": "^5.16.2",
    "tailwindcss": "^3.4.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.4"
  }
}
EOF

cat <<'EOF' > "$ROOT/playwright.config.ts"
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
EOF

cat <<'EOF' > "$ROOT/postcss.config.cjs"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

mkdir -p "$ROOT/prisma/migrations/0001_init"
cat <<'EOF' > "$ROOT/prisma/migrations/0001_init/migration.sql"
-- CreateEnum
CREATE TYPE "ExchangeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "hashedPassword" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "SelfReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "energy" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SelfReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "ExchangeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Redemption_userId_rewardId_key" ON "Redemption"("userId", "rewardId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfReport" ADD CONSTRAINT "SelfReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exchange" ADD CONSTRAINT "Exchange_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EOF

mkdir -p "$ROOT/prisma"
cat <<'EOF' > "$ROOT/prisma/schema.prisma"
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ExchangeStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

model User {
  id             String     @id @default(cuid())
  name           String?
  email          String?    @unique
  emailVerified  DateTime?
  hashedPassword String?
  image          String?
  accounts       Account[]
  sessions       Session[]
  selfReports    SelfReport[]
  exchanges      Exchange[]
  redemptions    Redemption[]
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model SelfReport {
  id        String   @id @default(cuid())
  userId    String
  mood      String
  energy    Int
  notes     String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Partner {
  id        String     @id @default(cuid())
  name      String
  email     String?    @unique
  exchanges Exchange[]
  createdAt DateTime   @default(now())
}

model Exchange {
  id        String         @id @default(cuid())
  userId    String
  partnerId String
  title     String
  summary   String
  status    ExchangeStatus @default(ACTIVE)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  partner   Partner        @relation(fields: [partnerId], references: [id])
}

model Reward {
  id          String        @id @default(cuid())
  name        String
  description String
  cost        Int
  redemptions Redemption[]
}

model Redemption {
  id        String   @id @default(cuid())
  userId    String
  rewardId  String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reward    Reward   @relation(fields: [rewardId], references: [id], onDelete: Cascade)

  @@unique([userId, rewardId])
}
EOF

mkdir -p "$ROOT/prisma"
cat <<'EOF' > "$ROOT/prisma/seed.ts"
import { PrismaClient, ExchangeStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@mission.test' },
    update: {},
    create: {
      email: 'demo@mission.test',
      name: 'Demo Pilot',
      hashedPassword: password,
    },
  });

  const partner = await prisma.partner.upsert({
    where: { email: 'ally@mission.test' },
    update: {},
    create: {
      name: 'Mission Ally',
      email: 'ally@mission.test',
    },
  });

  await prisma.selfReport.createMany({
    data: [
      {
        userId: user.id,
        mood: 'Optimistic',
        energy: 8,
        notes: 'Ready for the next sprint.',
      },
      {
        userId: user.id,
        mood: 'Curious',
        energy: 6,
        notes: 'Need more clarity on objectives.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.exchange.upsert({
    where: { id: 'seed-exchange' },
    update: {},
    create: {
      id: 'seed-exchange',
      userId: user.id,
      partnerId: partner.id,
      title: 'Weekly insights trade',
      summary: 'Sharing weekly retrospectives and resource lists.',
      status: ExchangeStatus.ACTIVE,
    },
  });

  await prisma.reward.createMany({
    data: [
      {
        id: 'reward-1',
        name: 'Focus Friday',
        description: 'Block your calendar for deep work with leadership support.',
        cost: 150,
      },
      {
        id: 'reward-2',
        name: 'Wellness stipend',
        description: 'Claim a $50 stipend for wellness activities.',
        cost: 250,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.redemption.upsert({
    where: {
      userId_rewardId: {
        userId: user.id,
        rewardId: 'reward-1',
      },
    },
    update: {},
    create: {
      userId: user.id,
      rewardId: 'reward-1',
    },
  });

  console.log('Seed data created for user', user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

mkdir -p "$ROOT/public"
cat <<'EOF' > "$ROOT/public/robots.txt"
User-agent: *
Allow: /
EOF

cat <<'EOF' > "$ROOT/tailwind.config.ts"
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        brand: {
          DEFAULT: '#4F46E5',
          foreground: '#FFFFFF'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    }
  },
  plugins: [require('tailwindcss-animate')]
};

export default config;
EOF

cat <<'EOF' > "$ROOT/tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "types": ["@total-typescript/ts-reset", "node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

mkdir -p "$ROOT/types"
cat <<'EOF' > "$ROOT/types/next-auth.d.ts"
import { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession['user'];
  }
}

export {};
EOF

