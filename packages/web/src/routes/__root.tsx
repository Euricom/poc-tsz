import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';

import appCss from '../styles.css?url';
import { ErrorBoundary } from '#/components/error-boundary';
import { readTheme } from '#/lib/theme';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
  errorComponent: ErrorBoundary,
  notFoundComponent: () => (
    <main>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
    </main>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = readTheme();
  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : undefined}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Outlet />
    </div>
  );
}
