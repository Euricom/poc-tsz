import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { readTheme, writeTheme, type Theme } from '#/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    writeTheme(next);
    setTheme(next);
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
