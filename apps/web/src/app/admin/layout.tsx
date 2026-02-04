'use client';

import { useAuth, useProtectedPage } from '../providers';
import ResponsiveNav from '../../components/responsive-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useProtectedPage({ roles: ['ADMIN'] });
  const { logout } = useAuth();
  const navItems = [
    { href: '/admin', label: 'Mensagem do dia' },
    { href: '/admin/boloes', label: 'Bolões' },
    { href: '/admin/times', label: 'Times' },
    { href: '/admin/jogos', label: 'Jogos' },
    { href: '/admin/rodadas', label: 'Rodadas' },
    { href: '/admin/campeoes', label: 'Campeões' },
    { href: '/admin/usuarios', label: 'Usuários' },
    { href: '/admin/ranking', label: 'Ver ranking' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <p className="text-sm text-gray-500">Área admin</p>
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
