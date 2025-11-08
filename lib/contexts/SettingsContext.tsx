'use client';

import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

interface SettingsState {
  themeMode: ThemeMode;
}

interface SettingsContextValue extends SettingsState {
  onToggleMode: () => void;
  onChangeMode: (mode: ThemeMode) => void;
}

const initialState: SettingsContextValue = {
  themeMode: 'light',
  onToggleMode: () => {},
  onChangeMode: () => {},
};

export const SettingsContext = createContext<SettingsContextValue>(initialState);

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used inside SettingsProvider');
  }
  return context;
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { themeMode: parsed.themeMode || 'light' };
        } catch {
          return { themeMode: 'light' };
        }
      }
    }
    return { themeMode: 'light' };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Debounce localStorage writes to prevent excessive writes
      const timeoutId = setTimeout(() => {
        localStorage.setItem('settings', JSON.stringify(settings));
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [settings]);

  const onToggleMode = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'light' ? 'dark' : 'light',
    }));
  }, []);

  const onChangeMode = useCallback((mode: ThemeMode) => {
    setSettings((prev) => ({ ...prev, themeMode: mode }));
  }, []);

  const memoizedValue = useMemo(
    () => ({
      ...settings,
      onToggleMode,
      onChangeMode,
    }),
    [settings, onToggleMode, onChangeMode]
  );

  return <SettingsContext.Provider value={memoizedValue}>{children}</SettingsContext.Provider>;
}
