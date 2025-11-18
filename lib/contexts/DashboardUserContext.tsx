'use client';

import { createContext, useContext, useMemo } from 'react';

interface DashboardUserContextValue {
  user: any;
}

const DashboardUserContext = createContext<DashboardUserContextValue | undefined>(undefined);

export function DashboardUserProvider({
  user,
  children,
}: {
  user: any;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ user }), [user]);
  return <DashboardUserContext.Provider value={value}>{children}</DashboardUserContext.Provider>;
}

export function useDashboardUser() {
  const context = useContext(DashboardUserContext);
  if (!context) {
    throw new Error('useDashboardUser must be used within a DashboardUserProvider');
  }
  return context;
}

