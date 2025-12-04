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
    // Always return light mode initially to avoid hydration mismatch
    // The actual theme will be loaded in useEffect
    return { themeMode: 'light' };
  });

  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('settings');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.themeMode === 'light' || parsed.themeMode === 'dark') {
            setSettings({ themeMode: parsed.themeMode });
          }
        } catch {
          // Keep default light mode
        }
      }
      setMounted(true);
    }
  }, []);

  // Save theme to localStorage immediately when it changes
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

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
