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
