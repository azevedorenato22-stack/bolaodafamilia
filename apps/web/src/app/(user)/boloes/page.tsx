'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import {
  entrarNoBolao,
  listarBoloesDisponiveis,
  listarMeusBoloes,
  sairDoBolao,
} from '../../../services/boloes.service';

export default function BoloesPage() {
  useProtectedPage({ roles: ['USUARIO'] });

  const [meusBoloes, setMeusBoloes] = useState<any[]>([]);
  const [disponiveis, setDisponiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErro(null);
    try {
      const [meus, disp] = await Promise.all([
        listarMeusBoloes(),
        listarBoloesDisponiveis(),
      ]);
      setMeusBoloes(meus ?? []);
      setDisponiveis(disp ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao carregar bolões.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEntrar = async (bolaoId: string) => {
    setActionId(bolaoId);
    setErro(null);
    try {
      await entrarNoBolao(bolaoId);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao entrar no bolão.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setActionId(null);
    }
  };

  const handleSair = async (bolaoId: string) => {
    setActionId(bolaoId);
    setErro(null);
    try {
      await sairDoBolao(bolaoId);
      await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao sair do bolão.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bolões</h1>
        <p className="text-sm text-gray-600">Entre em um bolão para começar a palpitar.</p>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {loading && <p className="text-sm text-gray-600">Carregando...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4 border-b text-sm font-semibold text-gray-700">
            Meus bolões ({meusBoloes.length})
          </div>
          <div className="divide-y divide-gray-100">
            {meusBoloes.map(b => (
              <div key={b.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{b.nome}</p>
                  {b.descricao && <p className="text-sm text-gray-600">{b.descricao}</p>}
                  {b.dataFinal && (
                    <p className="text-xs text-gray-500">
                      Final: {new Date(b.dataFinal).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700 font-semibold disabled:opacity-60"
                  disabled={actionId === b.id}
                  onClick={() => handleSair(b.id)}
                >
                  {actionId === b.id ? 'Saindo...' : 'Sair'}
                </button>
              </div>
            ))}
            {meusBoloes.length === 0 && (
              <p className="p-4 text-sm text-gray-600">Você ainda não participa de nenhum bolão.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="p-4 border-b text-sm font-semibold text-gray-700">
            Bolões disponíveis ({disponiveis.length})
          </div>
          <div className="divide-y divide-gray-100">
            {disponiveis.map(b => (
              <div key={b.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{b.nome}</p>
                  {b.descricao && <p className="text-sm text-gray-600">{b.descricao}</p>}
                  {b.dataFinal && (
                    <p className="text-xs text-gray-500">
                      Final: {new Date(b.dataFinal).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-sm text-primary-700 hover:text-primary-800 font-semibold disabled:opacity-60"
                  disabled={actionId === b.id}
                  onClick={() => handleEntrar(b.id)}
                >
                  {actionId === b.id ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            ))}
            {disponiveis.length === 0 && (
              <p className="p-4 text-sm text-gray-600">
                Nenhum bolão disponível no momento.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

