'use client';

import { useAdminChrome } from './AdminChromeContext';

export default function AdminFooter() {
  const { footer } = useAdminChrome();
  if (!footer) return null;

  return (
    <footer className="shrink-0 border-t border-gray-200 bg-white px-4 lg:px-6 py-3 flex items-center justify-end gap-3">
      {footer}
    </footer>
  );
}
