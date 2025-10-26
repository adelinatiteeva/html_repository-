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

