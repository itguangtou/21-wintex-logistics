'use client';

export default function AdminFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 h-10 border-t border-gray-200 bg-white px-4 flex items-center justify-center z-10">
      <p className="text-[11px] text-gray-400 text-center">
        © {year} Wintex Logistics Corp. All rights reserved.
      </p>
    </footer>
  );
}
