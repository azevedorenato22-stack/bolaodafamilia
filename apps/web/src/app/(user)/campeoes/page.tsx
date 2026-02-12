'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProtectedPage, useAuth } from '../../providers';
import {
  listarCampeoesPorBolao,
  listarPalpitesCampeao,
  criarPalpiteCampeao,
  atualizarPalpiteCampeao,
} from '../../../services/campeoes.service';
import { listarMeusBoloes } from '../../../services/boloes.service';

type PalpiteCampeao = {
  id: string;
  usuarioId: string;
  timeEscolhido?: { id: string; nome: string };
  timeEscolhidoId?: string;
  pontuacao?: number | null;
};

type CampeaoStatus = 'ABERTO' | 'PRAZO_ENCERRADO' | 'RESULTADO_DEFINIDO';

export default function CampeoesPage() {
  useProtectedPage({ roles: ['USUARIO'] });
  const { user } = useAuth();
  const [boloesch, setBoloes] = useState<any[]>([]);
  const [bolaoId, setBolaoId] = useState('');
  const [campeoes, setCampeoes] = useState<any[]>([]);
  const [times, setTimes] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (bolao: string, selectedBolao?: any) => {
    setLoading(true);
    setErro(null);
    try {
      const [campsRaw] = await Promise.all([listarCampeoesPorBolao(bolao)]);
      const camps = campsRaw.sort((a: any, b: any) => a.nome.localeCompare(b.nome));
      // para cada campeão, pegar meu palpite (se visível)
      const withPalpite = await Promise.all(
        camps.map(async (c: any) => {
          try {
            const palpites = await listarPalpitesCampeao(c.id);
            const meu = palpites.find((p: PalpiteCampeao) => p.usuarioId === user?.id);
            return { ...c, meuPalpite: meu, palpites };
          } catch {
            return { ...c, meuPalpite: null, palpites: [] };
          }
        }),
      );
      setCampeoes(withPalpite);
      const bolaoTimes =
        selectedBolao?.times ??
        boloesch.find(b => b.id === bolao)?.times ??
        [];
      setTimes(bolaoTimes.map((bt: any) => bt.time ?? bt));
    } catch {
      setErro('Falha ao carregar campeões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listarMeusBoloes()
      .then(b => {
        const lista = b ?? [];
        setBoloes(lista);
        if (lista[0]) {
          setBolaoId(lista[0].id);
          const bolaoTimes = lista[0].times ?? [];
          setTimes(bolaoTimes.map((bt: any) => bt.time ?? bt));
          load(lista[0].id, lista[0]);
        } else {
          setBolaoId('');
          setCampeoes([]);
          setTimes([]);
        }
      })
      .catch(() => setErro('Falha ao carregar bolões.'));
  }, []);

  const salvarPalpite = async (campeaoId: string, timeId: string) => {
    setErro(null);
    try {
      const camp = campeoes.find(c => c.id === campeaoId);
      const palpite = camp?.meuPalpite as PalpiteCampeao | undefined;
      if (palpite?.id) {
        await atualizarPalpiteCampeao(palpite.id, { campeaoId, timeId });
      } else {
        await criarPalpiteCampeao({ campeaoId, timeId });
      }
      await load(bolaoId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao salvar palpite.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Campeões</h1>
          <p className="text-sm text-slate-500 font-medium">
            Escolha o campeão para cada categoria do bolão antes do prazo.
          </p>
        </div>

        {boloesch.length > 0 && (
          <div className="w-full sm:w-auto min-w-[200px] max-w-xs">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bolão</label>
            <select
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              value={bolaoId}
              onChange={async e => {
                const id = e.target.value;
                setBolaoId(id);
                const selected = boloesch.find(b => b.id === id);
                setTimes((selected?.times ?? []).map((bt: any) => bt.time ?? bt));
                await load(id, selected);
              }}
            >
              {boloesch.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {loading && <p className="text-sm text-gray-600">Carregando...</p>}

      {boloesch.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-white">
          <p className="text-sm text-gray-700">
            Você ainda não participa de nenhum bolão.{' '}
            <Link href="/boloes" className="text-primary-700 underline">
              Ver bolões disponíveis
            </Link>
            .
          </p>
        </div>
      )}

      <div className="space-y-4">
        {campeoes.map(c => {
          const palpite = c.meuPalpite as PalpiteCampeao | undefined;
          const selectedTimeId = palpite?.timeEscolhidoId || palpite?.timeEscolhido?.id || '';
          const status = (c.status as CampeaoStatus | undefined) ?? 'ABERTO';
          const bloqueado = typeof c.bloqueado === 'boolean' ? c.bloqueado : status !== 'ABERTO';
          const resultadoDefinido = status === 'RESULTADO_DEFINIDO';
          const badgeLabel = status === 'RESULTADO_DEFINIDO'
            ? 'Resultado definido'
            : status === 'PRAZO_ENCERRADO'
              ? 'Prazo encerrado'
              : 'Aberto para palpites';
          const badgeColor = status === 'RESULTADO_DEFINIDO'
            ? 'bg-emerald-50 text-emerald-700'
            : status === 'PRAZO_ENCERRADO'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-blue-50 text-blue-700';
          const mostrarPalpites =
            status !== 'ABERTO'; // após prazo ou resultado, mostrar todos
          return (
            <div key={c.id} className="border border-gray-200 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{c.nome}</p>
                  <p className="text-sm text-gray-600">
                    Limite: {new Date(c.dataLimite).toLocaleString('pt-BR')} • Pontos:{' '}
                    {c.pontuacao ?? c.bolao?.ptsCampeao}
                  </p>
                  {c.resultadoFinal && (
                    <p className="text-sm text-emerald-700">
                      Resultado definido: {c.resultadoFinal.nome}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeColor}`}
                >
                  {badgeLabel}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Seu palpite</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    className="border rounded-lg px-3 py-2 text-sm"
                    disabled={bloqueado}
                    value={selectedTimeId}
                    onChange={e => salvarPalpite(c.id, e.target.value)}
                  >
                    <option value="">Selecione um time</option>
                    {times.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                  {palpite && (
                    <span className="text-xs text-gray-600">
                      Seu palpite: {palpite.timeEscolhido?.nome || '—'}
                      {palpite.pontuacao !== undefined && resultadoDefinido
                        ? ` • Pontos: ${palpite.pontuacao ?? 0}`
                        : ''}
                    </span>
                  )}
                </div>
                {mostrarPalpites && (
                  <div className="mt-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Palpites dos usuários</p>
                    {c.palpites?.length ? (
                      <div className="space-y-1">
                        {c.palpites.map((p: any) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm"
                          >
                            <span className="font-medium text-gray-800">{p.usuario?.nome || 'Usuário'}</span>
                            <div className="flex items-center gap-2 text-gray-700">
                              <span>{p.timeEscolhido?.nome || '—'}</span>
                              {resultadoDefinido && typeof p.pontuacao === 'number' && (
                                <span className="text-xs text-emerald-700 font-semibold">
                                  {p.pontuacao} pts
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Nenhum palpite disponível.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {campeoes.length === 0 && !loading && (
          <p className="text-sm text-gray-600">Nenhum campeão disponível para este bolão.</p>
        )}
      </div>
    </div>
  );
}
