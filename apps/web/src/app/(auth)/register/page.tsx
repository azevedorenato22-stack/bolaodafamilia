'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../providers';
import { useState } from 'react';
import { register as registerApi } from '../../../services/auth.service';
import { useEffect } from 'react';
import { mensagemAtual } from '../../../services/mensagem.service';

export default function RegisterPage() {
  const { login, closeMensagemPopup } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<any | null>(null);

  useEffect(() => {
    closeMensagemPopup();
    mensagemAtual().then(setMensagem).catch(() => setMensagem(null));
  }, [closeMensagemPopup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await registerApi({ nome, senha });
      login(data.accessToken, {
        id: data.usuario.id,
        nome: data.usuario.nome,
        usuario: data.usuario.usuario,
        tipo: data.usuario.tipo,
      });
      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      router.replace('/dashboard');
    } catch (err) {
      setError('Falha ao cadastrar. Verifique os dados ou se o nome já está em uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2 text-center flex flex-col items-center">
        <Image
          src="/assets/icon-chuveiro.png"
          width={80}
          height={80}
          alt="Bolão Amigos"
          className="mb-2"
        />
        <p className="text-lg font-semibold text-primary-900">Cadastre-se</p>
        <p className="text-sm text-gray-600">Crie sua conta usando apenas seu Nome e Senha.</p>
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
        {loading ? 'Cadastrando...' : 'Cadastrar'}
      </button>
      <p className="text-center text-sm text-gray-600">
        Já tem conta?{' '}
        <a className="text-primary-700 font-semibold" href="/login">
          Faça login
        </a>
      </p>
      {mensagem && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold text-amber-800">
            {mensagem.titulo || 'Mensagem do administrador'}
          </p>
          <p>{mensagem.conteudo}</p>
        </div>
      )}
    </form>
  );
}
