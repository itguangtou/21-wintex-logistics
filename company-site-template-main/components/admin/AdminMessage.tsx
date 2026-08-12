'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type AdminMessageType = 'success' | 'error' | 'warning' | 'info';

type AdminMessageItem = {
  id: number;
  type: AdminMessageType;
  text: string;
};

type AdminMessageApi = {
  success: (text: string) => void;
  error: (text: string) => void;
  warning: (text: string) => void;
  info: (text: string) => void;
};

const AdminMessageContext = createContext<AdminMessageApi | null>(null);

let idSeq = 1;

const TYPE_STYLE: Record<AdminMessageType, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-slate-50 border-slate-200 text-slate-700',
};

export function AdminMessageProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AdminMessageItem[]>([]);

  const push = useCallback((type: AdminMessageType, text: string) => {
    const id = idSeq++;
    setItems((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((m) => m.id !== id));
    }, 3200);
  }, []);

  const api = useMemo<AdminMessageApi>(
    () => ({
      success: (text) => push('success', text),
      error: (text) => push('error', text),
      warning: (text) => push('warning', text),
      info: (text) => push('info', text),
    }),
    [push]
  );

  return (
    <AdminMessageContext.Provider value={api}>
      {children}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[min(92vw,420px)]"
        aria-live="polite"
      >
        {items.map((m) => (
          <div
            key={m.id}
            className={[
              'pointer-events-auto px-4 py-2.5 rounded-lg border shadow-md text-sm font-medium text-center',
              TYPE_STYLE[m.type],
            ].join(' ')}
          >
            {m.text}
          </div>
        ))}
      </div>
    </AdminMessageContext.Provider>
  );
}

export function useAdminMessage(): AdminMessageApi {
  const ctx = useContext(AdminMessageContext);
  if (!ctx) {
    // 未包 Provider 时降级为 no-op，避免炸页面
    return {
      success: () => undefined,
      error: () => undefined,
      warning: () => undefined,
      info: () => undefined,
    };
  }
  return ctx;
}
