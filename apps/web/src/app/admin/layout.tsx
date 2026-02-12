'use client';

import { useAuth, useProtectedPage } from '../providers';
import ResponsiveNav from '../../components/responsive-nav';
import {
  MessageSquare,
  Trophy,
  Shield,
  Gamepad2,
  List,
  Crown,
  Users,
  BarChart3,
} from 'lucide-react';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useProtectedPage({ roles: ['ADMIN'] });
  const { logout } = useAuth();
  const navItems = [
    { href: '/admin/mensagens', label: 'Mensagem', icon: <MessageSquare size={18} /> },
    { href: '/admin/boloes', label: 'Bolões', icon: <Trophy size={18} /> },
    { href: '/admin/times', label: 'Times', icon: <Shield size={18} /> },
    { href: '/admin/jogos', label: 'Jogos', icon: <Gamepad2 size={18} /> },
    { href: '/admin/rodadas', label: 'Rodadas', icon: <List size={18} /> },
    { href: '/admin/campeoes', label: 'Campeões', icon: <Crown size={18} /> },
    { href: '/admin/usuarios', label: 'Usuários', icon: <Users size={18} /> },
    { href: '/admin/ranking', label: 'Ranking', icon: <BarChart3 size={18} /> },
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
