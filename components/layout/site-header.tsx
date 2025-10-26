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
