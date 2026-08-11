'use client';

export default function AdminFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 min-h-14 border-t border-gray-200 bg-white px-4 lg:px-6 py-4 flex items-center justify-center z-10">
      <p className="text-xs sm:text-sm text-gray-400 text-center leading-relaxed">
        © {year} Wintex Logistics Corp. All rights reserved.
      </p>
    </footer>
  );
}
