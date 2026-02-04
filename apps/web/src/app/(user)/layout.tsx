'use client';

import { useAuth, useProtectedPage } from '../providers';
import ResponsiveNav from '../../components/responsive-nav';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user } = useProtectedPage({ roles: ['USUARIO'] });
  const { logout } = useAuth();
  const navItems = [
    { href: '/dashboard', label: 'Jogos' },
    { href: '/boloes', label: 'Bolões' },
    { href: '/campeoes', label: 'Campeões' },
    { href: '/ranking', label: 'Ranking' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <div>
              <p className="text-sm text-gray-500">Bem-vindo</p>
              <p className="font-semibold text-gray-900">{user?.nome}</p>
            </div>
          </div>
          <ResponsiveNav items={navItems} onLogout={logout} />
        </div>
      </header>
      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  );
}
