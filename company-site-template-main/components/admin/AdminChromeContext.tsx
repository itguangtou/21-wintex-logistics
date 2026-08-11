'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AdminChromeContextValue = {
  subtitle: string | null;
  setSubtitle: (text: string | null) => void;
};

const AdminChromeContext = createContext<AdminChromeContextValue | null>(null);

export function AdminChromeProvider({ children }: { children: React.ReactNode }) {
  const [subtitle, setSubtitleState] = useState<string | null>(null);

  const setSubtitle = useCallback((text: string | null) => {
    setSubtitleState(text);
  }, []);

  const value = useMemo(() => ({ subtitle, setSubtitle }), [subtitle, setSubtitle]);

  return <AdminChromeContext.Provider value={value}>{children}</AdminChromeContext.Provider>;
}

export function useAdminChrome() {
  const ctx = useContext(AdminChromeContext);
  if (!ctx) throw new Error('useAdminChrome must be used within AdminChromeProvider');
  return ctx;
}
