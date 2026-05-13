import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { ThemeToggle } from '#/components/theme-toggle';
import { getServerSession as getServerSessionImpl } from '#/lib/auth.server';

const getServerSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  if (!request) {
    console.log('[guard] no request — treating as unauthenticated');
    return null;
  }
  const session = await getServerSessionImpl(request.headers);
  console.log(`[guard] getSession → ${session?.user ? `user=${session.user.email ?? session.user.id}` : 'no session'}`);
  return session;
});

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    console.log(`[guard] beforeLoad → ${location.pathname}`);
    const session = await getServerSession();
    if (!session || session.error === 'RefreshAccessTokenError') {
      console.log(`[guard] redirect → /login (from ${location.pathname})`);
      throw redirect({ to: '/login' });
    }
    return { session };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <>
      <nav className="mb-6 flex items-center gap-4 text-sm">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/animals" className="[&.active]:font-bold">
          Animals
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </nav>
      <Outlet />
    </>
  );
}
