'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavItem = {
  href: string;
  label: string;
};

type ResponsiveNavProps = {
  items: NavItem[];
  onLogout: () => void;
};

export default function ResponsiveNav({ items, onLogout }: ResponsiveNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (href: string) =>
    `block rounded-md px-3 py-2 text-sm transition-colors ${
      isActive(href)
        ? 'bg-primary-50 text-primary-700 font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="relative">
      <div className="hidden md:flex items-center gap-2">
        {items.map(item => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}
        <button
          onClick={onLogout}
          className="rounded-md px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
        >
          Sair
        </button>
      </div>

      <div className="md:hidden">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen(prev => !prev)}
        >
          ☰
        </button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-40 mt-3 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg md:hidden">
            <div className="flex max-h-[70vh] flex-col overflow-auto p-2">
              {items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="mt-1 rounded-md px-3 py-2 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
