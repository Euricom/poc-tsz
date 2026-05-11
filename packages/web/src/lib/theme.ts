import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

export type Theme = 'light' | 'dark';

const COOKIE_RE = /(?:^|;\s*)theme=(light|dark)/;
const parse = (cookie: string): Theme => (COOKIE_RE.exec(cookie)?.[1] === 'dark' ? 'dark' : 'light');

export const readTheme = createIsomorphicFn()
  .client((): Theme => parse(document.cookie))
  .server((): Theme => parse(getRequest()?.headers.get('cookie') ?? ''));

export function writeTheme(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
