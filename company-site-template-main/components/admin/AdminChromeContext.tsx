'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type AdminChromeContextValue = {
  footer: React.ReactNode;
  setFooter: (node: React.ReactNode) => void;
  subtitle: string | null;
  setSubtitle: (text: string | null) => void;
};

const AdminChromeContext = createContext<AdminChromeContextValue | null>(null);

export function AdminChromeProvider({ children }: { children: React.ReactNode }) {
  const [footer, setFooterState] = useState<React.ReactNode>(null);
  const [subtitle, setSubtitleState] = useState<string | null>(null);

  const setFooter = useCallback((node: React.ReactNode) => {
    setFooterState(node);
  }, []);

  const setSubtitle = useCallback((text: string | null) => {
    setSubtitleState(text);
  }, []);

  const value = useMemo(
    () => ({ footer, setFooter, subtitle, setSubtitle }),
    [footer, setFooter, subtitle, setSubtitle]
  );

  return <AdminChromeContext.Provider value={value}>{children}</AdminChromeContext.Provider>;
}

export function useAdminChrome() {
  const ctx = useContext(AdminChromeContext);
  if (!ctx) throw new Error('useAdminChrome must be used within AdminChromeProvider');
  return ctx;
}
