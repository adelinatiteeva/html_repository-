export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/self-report/:path*', '/exchange/:path*', '/redeem/:path*'],
};
