import { getRequest } from '@tanstack/react-start/server';

export type Theme = 'light' | 'dark';

const COOKIE_RE = /(?:^|;\s*)theme=(light|dark)/;

export function readTheme(): Theme {
  const cookie =
    typeof document === 'undefined' ? (getRequest()?.headers.get('cookie') ?? '') : document.cookie;
  return COOKIE_RE.exec(cookie)?.[1] === 'dark' ? 'dark' : 'light';
}

export function writeTheme(theme: Theme) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
