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

const TYPE_STYLE: Record<
  AdminMessageType,
  { box: string; icon: string; label: string }
> = {
  success: {
    box: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: 'text-emerald-600',
    label: '成功',
  },
  error: {
    box: 'bg-red-50 border-red-200 text-red-700',
    icon: 'text-red-600',
    label: '错误',
  },
  warning: {
    box: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'text-amber-600',
    label: '警告',
  },
  info: {
    box: 'bg-slate-50 border-slate-200 text-slate-700',
    icon: 'text-slate-600',
    label: '提示',
  },
};

function MessageIcon({ type }: { type: AdminMessageType }) {
  const cls = `h-4 w-4 shrink-0 ${TYPE_STYLE[type].icon}`;
  if (type === 'success') {
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AdminMessageProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AdminMessageItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const push = useCallback((type: AdminMessageType, text: string) => {
    const id = idSeq++;
    setItems((prev) => [...prev, { id, type, text }]);
    window.setTimeout(() => {
      dismiss(id);
    }, 3200);
  }, [dismiss]);

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
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[min(92vw,440px)]"
        aria-live="polite"
      >
        {items.map((m) => (
          <div
            key={m.id}
            role="alert"
            className={[
              'pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg text-sm',
              'animate-[adminMessageIn_0.28s_ease-out]',
              TYPE_STYLE[m.type].box,
            ].join(' ')}
            onClick={() => dismiss(m.id)}
          >
            <MessageIcon type={m.type} />
            <p className="flex-1 font-medium leading-snug pt-px">{m.text}</p>
            <span className="sr-only">{TYPE_STYLE[m.type].label}</span>
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes adminMessageIn {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </AdminMessageContext.Provider>
  );
}

export function useAdminMessage(): AdminMessageApi {
  const ctx = useContext(AdminMessageContext);
  if (!ctx) {
    return {
      success: () => undefined,
      error: () => undefined,
      warning: () => undefined,
      info: () => undefined,
    };
  }
  return ctx;
}
