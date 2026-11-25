import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { ModePreference, ThemeMode } from './themes';

export const MODE_STORAGE_KEY = 'kixvault-mode';

type ModeContextValue = {
  /** The user's choice, which may be `system`. */
  mode: ModePreference;
  /** What is actually applied. */
  resolvedMode: ThemeMode;
  setMode: (mode: ModePreference) => void;
};

const ModeContext = createContext<ModeContextValue>({
  mode: 'system',
  resolvedMode: 'light',
  setMode: () => {},
});

function readStored(): ModePreference {
  try {
    const value = localStorage.getItem(MODE_STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Storage can be blocked; fall back to following the system.
  }
  return 'system';
}

export function resolveMode(mode: ModePreference): ThemeMode {
  if (mode !== 'system') return mode;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Light/dark mode, kept separate from the colorway (`data-theme`). Toggles the `dark` class on
 * <html>, which the token blocks in index.css and the Tailwind `dark:` variant both key off.
 */
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ModePreference>(readStored);
  const [resolvedMode, setResolvedMode] = useState<ThemeMode>(() => resolveMode(mode));

  useEffect(() => {
    const apply = () => {
      const next = resolveMode(mode);
      setResolvedMode(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    apply();

    if (mode !== 'system' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [mode]);

  const setMode = useCallback((next: ModePreference) => {
    setModeState(next);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Not persisted; still applies for this session.
    }
  }, []);

  return <ModeContext value={{ mode, resolvedMode, setMode }}>{children}</ModeContext>;
}

export function useMode() {
  return useContext(ModeContext);
}
