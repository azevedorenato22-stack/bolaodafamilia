'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { mensagemAtual } from '../services/mensagem.service';
import { me } from '../services/auth.service';

type User = {
  id: string;
  nome: string;
  usuario: string;
  tipo: 'ADMIN' | 'USUARIO';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  mensagem: any | null;
  showMensagemPopup: boolean;
  closeMensagemPopup: () => void;
  loadingUser: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<any | null>(null);
  const [showMensagemPopup, setShowMensagemPopup] = useState(false);
  const [idle, setIdle] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setLoadingUser(false);
      return;
    }
    setToken(storedToken);
    me()
      .then(data => {
        setUser({
          id: data.id,
          nome: data.nome,
          usuario: data.usuario,
          tipo: data.tipo,
        });
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoadingUser(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login: (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        router.replace('/login');
      },
      mensagem,
      showMensagemPopup,
      closeMensagemPopup: () => setShowMensagemPopup(false),
      loadingUser,
    }),
    [user, token, mensagem, showMensagemPopup, router, loadingUser],
  );

  // Mensagem do dia
  useEffect(() => {
    mensagemAtual()
      .then(setMensagem)
      .catch(() => setMensagem(null));
  }, []);

  // Ao chegar em páginas públicas (home/login/register), garante que o popup não bloqueie ações primárias
  useEffect(() => {
    const isPublicPage =
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/register');
    if (isPublicPage) {
      setShowMensagemPopup(false);
    }
  }, [pathname]);

  // Inatividade: exibir popup da mensagem ao retornar, mas manter sessão
  // Inatividade: leva para home e exibe popup de mensagem ao retornar, inclusive na landing/login
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetIdle = () => {
      if (idle && mensagem) {
        setShowMensagemPopup(true);
      }
      setIdle(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIdle(true);
        if (pathname !== '/') {
          router.push('/');
        }
      }, 5 * 60 * 1000); // 5 minutos
    };

    if (typeof window !== 'undefined') {
      ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, resetIdle),
      );
      resetIdle();
    }

    return () => {
      clearTimeout(timeout);
      if (typeof window !== 'undefined') {
        ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(evt =>
          window.removeEventListener(evt, resetIdle),
        );
      }
    };
  }, [idle, mensagem, pathname, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useProtectedPage(
  options: { role?: 'ADMIN' | 'USUARIO'; roles?: ('ADMIN' | 'USUARIO')[] } = {},
) {
  const { user, token, logout, loadingUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const allowedRoles =
    options.roles ?? (options.role ? [options.role] : ['ADMIN', 'USUARIO']);

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!token) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!allowedRoles.includes(user.tipo)) {
      router.replace('/');
    }
  }, [token, user, router, pathname, allowedRoles, loadingUser]);

  return { user, token };
}
