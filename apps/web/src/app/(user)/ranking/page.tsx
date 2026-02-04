'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProtectedPage } from '../../providers';
import { rankingGeral } from '../../../services/ranking.service';
import { listarBoloesAtivos, listarMeusBoloes } from '../../../services/boloes.service';
import { ExtratoModal } from '../../../components/extrato-modal';

export default function RankingPage() {
  const { user } = useProtectedPage({ roles: ['USUARIO', 'ADMIN'] });
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [semBoloes, setSemBoloes] = useState(false);
  const [bolaoId, setBolaoId] = useState<string>('');
  const [appliedBolaoId, setAppliedBolaoId] = useState<string>('');
  const [boloesch, setBoloes] = useState<any[]>([]);
  const [usuarioExtrato, setUsuarioExtrato] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ rodadaId: '', status: '', data: '' });
  const [appliedFiltros, setAppliedFiltros] = useState({ rodadaId: '', status: '', data: '' });

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const boloesAtivos =
          user.tipo === 'USUARIO' ? await listarMeusBoloes() : await listarBoloesAtivos();
        setBoloes(boloesAtivos);
        const selected = boloesAtivos[0]?.id;
        if (selected) {
          setSemBoloes(false);
          setErro(null);
          setBolaoId(selected);
          // carrega ranking padrão (ENCERRADO) no primeiro bolão
          const base = { rodadaId: '', status: '', data: '' };
          setFiltros(base);
          setAppliedFiltros(base);
          setAppliedBolaoId(selected);
          const r = await rankingGeral(selected, base);
          setRanking(r);
        } else {
          setRanking([]);
          setBolaoId('');
          setAppliedBolaoId('');
          if (user.tipo === 'USUARIO') {
            setSemBoloes(true);
            setErro(null);
          } else {
            setSemBoloes(false);
            setErro('Nenhum bolão ativo disponível.');
          }
        }
      } catch (e) {
        setSemBoloes(false);
        setErro('Falha ao carregar ranking.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.tipo]);

  const bolaoSelecionado = boloesch.find(b => b.id === bolaoId);
  const rodadas = (bolaoSelecionado?.rodadas ?? []).filter((r: any) => r.ativo !== false).slice().sort((a: any, b: any) => {
    const aOrd = a.numeroOrdem ?? 0;
    const bOrd = b.numeroOrdem ?? 0;
    if (aOrd !== bOrd) return aOrd - bOrd;
    return String(a.nome).localeCompare(String(b.nome));
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Ranking</h1>
        <p className="text-sm text-gray-600">
          Critérios: Total (Jogos + Campeões) &gt; Jogos &gt; PC &gt; PV &gt; DG &gt; PP &gt; V
        </p>
        {boloesch.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={bolaoId}
              onChange={async e => {
                const id = e.target.value;
                setBolaoId(id);
                setErro(null);
                setUsuarioExtrato(null);
                setRanking([]);
                setAppliedBolaoId('');
                const base = { rodadaId: '', status: '', data: '' };
                setFiltros(base);
                setAppliedFiltros(base);
              }}
            >
              {boloesch.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={filtros.rodadaId}
              onChange={e => setFiltros({ ...filtros, rodadaId: e.target.value })}
            >
              <option value="">Todas as rodadas</option>
              {rodadas.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={filtros.status}
              onChange={e => setFiltros({ ...filtros, status: e.target.value })}
            >
              <option value="">Encerrados (padrão)</option>
              <option value="PALPITES">Palpites</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="ENCERRADO">Encerrados</option>
            </select>
            <input
              type="date"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={filtros.data}
              onChange={e => setFiltros({ ...filtros, data: e.target.value })}
            />
            <button
              className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg"
              onClick={async () => {
                if (!bolaoId) {
                  setErro('Selecione um bolão.');
                  return;
                }
                setLoading(true);
                setErro(null);
                try {
                  const payload = {
                    rodadaId: filtros.rodadaId,
                    status: filtros.status,
                    data: filtros.data,
                  };
                  const r = await rankingGeral(bolaoId, payload);
                  setRanking(r);
                  setAppliedBolaoId(bolaoId);
                  setAppliedFiltros(payload);
                } catch (err: any) {
                  const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Falha ao carregar ranking.';
                  setErro(Array.isArray(msg) ? msg.join(', ') : msg);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Aplicar filtros
            </button>
            <button
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
              onClick={async () => {
                if (!bolaoId) {
                  setErro('Selecione um bolão.');
                  return;
                }
                const base = { rodadaId: '', status: '', data: '' };
                setFiltros(base);
                setAppliedFiltros(base);
                setLoading(true);
                setErro(null);
                try {
                  const r = await rankingGeral(bolaoId, base);
                  setRanking(r);
                  setAppliedBolaoId(bolaoId);
                } catch (err: any) {
                  const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Falha ao carregar ranking.';
                  setErro(Array.isArray(msg) ? msg.join(', ') : msg);
                } finally {
                  setLoading(false);
                }
              }}
            >
              Limpar
            </button>
          </div>
        )}
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {loading && <p className="text-sm text-gray-600">Carregando ranking...</p>}
      {semBoloes && (
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
      {!bolaoId && !semBoloes && (
        <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-white">
          <p className="text-sm text-gray-700">Selecione um bolão para ver o ranking.</p>
        </div>
      )}
      {bolaoId && !appliedBolaoId && (
        <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-white">
          <p className="text-sm text-gray-700">
            Selecione os filtros e clique em <span className="font-semibold">Aplicar filtros</span>.
          </p>
        </div>
      )}
      {bolaoId && appliedBolaoId && (
        <>
          <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">Pos</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Pontos</th>
                  <th className="px-4 py-3">Campeões</th>
                  <th className="px-4 py-3">PC</th>
                  <th className="px-4 py-3">PV</th>
                  <th className="px-4 py-3">DG</th>
                  <th className="px-4 py-3">PP</th>
                  <th className="px-4 py-3">V</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ranking.map(row => (
                  <tr
                    key={row.usuarioId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setUsuarioExtrato(row.usuarioId)}
                  >
                    <td className="px-4 py-3 font-semibold">{row.posicao}</td>
                    <td className="px-4 py-3">{row.nome}</td>
                    <td className="px-4 py-3 font-semibold text-primary-700">{row.pontosTotal}</td>
                    <td className="px-4 py-3">{row.pontosCampeao}</td>
                    <td className="px-4 py-3">{row.pc}</td>
                    <td className="px-4 py-3">{row.pv}</td>
                    <td className="px-4 py-3">{row.dg}</td>
                    <td className="px-4 py-3">{row.pp}</td>
                    <td className="px-4 py-3">{row.v}</td>
                  </tr>
                ))}
                {ranking.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-600" colSpan={9}>
                      Nenhum dado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <ExtratoModal
            bolaoId={appliedBolaoId}
            usuarioId={usuarioExtrato}
            filters={appliedFiltros}
            onClose={() => setUsuarioExtrato(null)}
          />
        </>
      )}
    </div>
  );
}
