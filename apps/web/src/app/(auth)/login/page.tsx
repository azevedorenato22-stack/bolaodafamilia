'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../providers';
import { login as loginApi } from '../../../services/auth.service';
import { mensagemAtual } from '../../../services/mensagem.service';

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
    mensagemAtual().then(setMensagem).catch(() => setMensagem(null));
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
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2 text-center flex flex-col items-center">
          <Image
            src="/assets/icon-chuveiro.png"
            width={80}
            height={80}
            alt="Bolão Amigos"
            className="mb-2"
          />
          <p className="text-lg font-semibold text-primary-900">Bolão do Chuveiro Ligado</p>
          <p className="text-sm text-gray-600">Acesse para fazer palpites e acompanhar o ranking.</p>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Seu Nome</label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            placeholder="Digite seu nome"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Senha</label>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
        <button
          type="submit"
          className="w-full bg-primary-600 text-white rounded-lg py-2 font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-center text-sm text-gray-600">
          Não tem conta?{' '}
          <a className="text-primary-700 font-semibold" href="/register">
            Cadastre-se com seu Nome
          </a>
        </p>
      </form>
      {mensagem && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold text-amber-800">
            {mensagem.titulo || 'Mensagem do administrador'}
          </p>
          <p>{mensagem.conteudo}</p>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-600">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
