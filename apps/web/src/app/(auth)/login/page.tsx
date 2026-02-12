'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { login as loginApi } from '../../../services/auth.service';
import { mensagensAtivas } from '../../../services/mensagem.service';

function LoginForm() {
  const { login, closeMensagemPopup, user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<any | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    closeMensagemPopup();
    mensagensAtivas()
      .then(msgs => {
        const msg = msgs.find((m: any) => !['pato', 'lider', 'destaque'].includes(m.tipo)) || msgs[0] || null;
        setMensagem(msg);
      })
      .catch(() => setMensagem(null));
  }, [closeMensagemPopup]);

  const resolveRedirect = (fromParam: string | null, tipo: 'ADMIN' | 'USUARIO') => {
    const defaultPath = tipo === 'ADMIN' ? '/admin' : '/dashboard';
    const from = fromParam ?? '';

    const isValid =
      from.startsWith('/') &&
      !from.startsWith('//') &&
      !from.includes('http') &&
      from !== '/login' &&
      !from.startsWith('/login');

    if (!isValid) return defaultPath;

    if (tipo === 'USUARIO' && from.startsWith('/admin')) {
      return '/dashboard';
    }

    if (tipo === 'ADMIN' && !from.startsWith('/admin')) {
      return '/admin';
    }

    return from;
  };

  useEffect(() => {
    if (pendingRedirect && token && user) {
      router.replace(pendingRedirect);
      setPendingRedirect(null);
    }
  }, [pendingRedirect, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await loginApi({ nome, senha });
      login(data.accessToken, {
        id: data.usuario.id,
        nome: data.usuario.nome,
        usuario: data.usuario.usuario,
        tipo: data.usuario.tipo,
      });
      const redirect = resolveRedirect(searchParams.get('from'), data.usuario.tipo);
      setPendingRedirect(redirect);
    } catch (err) {
      setError('Falha ao autenticar. Verifique suas credenciais.');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho removido para evitar duplicação com layout externo */}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter ml-1">Seu Nome</label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all placeholder:text-slate-400"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            placeholder="Ex: João Silva"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter ml-1">Senha</label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 transition-all"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-medium text-red-600 animate-fade-in-up">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-xs font-medium text-green-700 animate-fade-in-up">
            ✅ {success}
          </div>
        )}

        <button
          type="submit"
          className="group relative w-full bg-gradient-to-r from-gray-800 to-black text-white rounded-2xl py-3.5 font-bold shadow-lg shadow-gray-500/20 hover:shadow-gray-600/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 overflow-hidden"
          disabled={loading}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          {loading ? 'Validando...' : 'Entrar no Bolão'}
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-500">
            Ainda não tem conta?{' '}
            <Link className="text-gray-900 font-bold hover:underline" href="/register">
              Cadastre-se Agora
            </Link>
          </p>
        </div>
      </form>

      {mensagem && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">{mensagem.conteudo}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-600">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
