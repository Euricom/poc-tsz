import { createFileRoute } from '@tanstack/react-router';
import { Button } from '#/components/ui/button';
import { signOut, useSession } from '#/lib/auth-client';

export const Route = createFileRoute('/_authed/')({ component: Home });

const handleLogout = async () => {
  console.log('[home] logout clicked');
  try {
    await signOut('/login');
  } catch (err) {
    console.error('[home] sign-out failed', err);
  }
};

function Home() {
  const { data, isPending } = useSession();
  const user = data?.user;

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome{user ? `, ${user.name}` : ''}</h1>
      {isPending && <p className="text-sm text-gray-500">Loading session…</p>}
      {user && (
        <dl className="rounded-md border p-3 text-sm">
          <div className="flex gap-2">
            <dt className="font-medium">Name:</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium">Email:</dt>
            <dd>{user.email}</dd>
          </div>
          {user.id && (
            <div className="flex gap-2">
              <dt className="font-medium">ID:</dt>
              <dd className="font-mono text-xs">{user.id}</dd>
            </div>
          )}
        </dl>
      )}
      <Button variant="outline" onClick={handleLogout}>
        Logout
      </Button>
    </main>
  );
}
