import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { Button } from '#/components/ui/button';
import { auth } from '#/lib/auth.server';
import { signIn } from '#/lib/auth-client';

const getServerSession = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  if (!request) return null;
  return auth.api.getSession({ headers: request.headers });
});

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getServerSession();
    if (session?.user) {
      console.log('[login] already signed in → /');
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const handleClick = () => {
    console.log('[login] sign-in clicked → microsoft');
    signIn.social({
      provider: 'microsoft',
      callbackURL: '/',
    });
  };

  return (
    <main className="grid min-h-[60vh] place-items-center">
      <div className="w-80 space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-gray-600">Use your Microsoft (Euricom) account.</p>
        <Button onClick={handleClick} className="w-full">
          Sign in with Microsoft
        </Button>
      </div>
    </main>
  );
}
