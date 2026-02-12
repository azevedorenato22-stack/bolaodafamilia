'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import { listarBoloesAdmin } from '../../../services/boloes.service';
import {
  listarCampeoesPorBolao,
  listarPalpitesCampeao,
  criarCampeao,
  atualizarCampeao,
  excluirCampeao,
  atualizarPalpiteCampeaoAdmin,
} from '../../../services/campeoes.service';
import { listarTimes } from '../../../services/times.service';
import { ConfirmModal } from '../../../components/confirm-modal';

export default function AdminCampeoesPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [boloes, setBoloes] = useState<any[]>([]);
  const [bolaoId, setBolaoId] = useState('');
  const [campeoes, setCampeoes] = useState<any[]>([]);
  const [times, setTimes] = useState<any[]>([]);
  const [form, setForm] = useState({
    nome: '',
    dataLimite: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [palpites, setPalpites] = useState<Record<string, any[]>>({});

  // Estado para controlar resultados selecionados mas não salvos
  const [tempResults, setTempResults] = useState<Record<string, string>>({});
  const [savingResult, setSavingResult] = useState<string | null>(null);

  const formatDateTimeLocal = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const toIsoFromLocalInput = (value: string) => {
    if (!value) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString();
  };

  const load = async (id: string, bolaoSelecionado?: any) => {
    if (!id) return;
    setErro(null);
    setSucesso(null);
    try {
      const list = await listarCampeoesPorBolao(id);
      setCampeoes(list.sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
      const bolao = bolaoSelecionado ?? boloes.find(b => b.id === id);
      const bolaoTimes = bolao?.times?.map((bt: any) => bt.time ?? bt) ?? [];
      setTimes(bolaoTimes.sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
      const palpitesMap: Record<string, any[]> = {};
      await Promise.all(
        list.map(async (c: any) => {
          try {
            const palps = await listarPalpitesCampeao(c.id);
            palpitesMap[c.id] = palps;
          } catch {
            palpitesMap[c.id] = [];
          }
        }),
      );
      setPalpites(palpitesMap);
    } catch {
      setErro('Falha ao carregar campeões.');
    }
  };

  useEffect(() => {
    Promise.all([listarBoloesAdmin(), listarTimes()])
      .then(([b, t]) => {
        const ativos = b.filter((bolao: any) => bolao.ativo);
        setBoloes(ativos);
      })
      .catch(() => setErro('Falha ao carregar dados.'));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    if (!bolaoId) return;
    try {
      if (editingId) {
        await atualizarCampeao(editingId, {
          nome: form.nome,
          dataLimite: toIsoFromLocalInput(form.dataLimite),
        });
      } else {
        await criarCampeao({
          bolaoId,
          nome: form.nome,
          dataLimite: toIsoFromLocalInput(form.dataLimite),
        });
      }
      setForm({ nome: '', dataLimite: '' });
      setEditingId(null);
      await load(bolaoId);
      setSucesso(editingId ? 'Campeão atualizado com sucesso.' : 'Campeão criado com sucesso.');
    } catch {
      setErro('Erro ao salvar campeão.');
    }
  };

  const handleDefinirResultado = async (campeaoId: string) => {
    const timeId = tempResults[campeaoId];
    if (!timeId) return;

    setSavingResult(campeaoId);
    setErro(null);
    setSucesso(null);

    try {
      await atualizarCampeao(campeaoId, { resultadoFinalId: timeId });
      await load(bolaoId);
      setSucesso('Resultado definido e pontuação recalculada!');
      setTempResults(prev => {
        const copy = { ...prev };
        delete copy[campeaoId];
        return copy;
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao definir resultado.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSavingResult(null);
    }
  };

  const atualizarPalpiteAdmin = async (palpiteId: string, campeaoId: string, timeId: string) => {
    // Mantendo comportamento onChange direto para palpites, mas com feedback visual se possível?
    // User não reclamou disso especificamente, reclamou do "Botão de salvar". 
    // Vou manter as-is mas adicionar try/catch com feedback
    try {
      await atualizarPalpiteCampeaoAdmin(palpiteId, { timeId });
      const palps = await listarPalpitesCampeao(campeaoId);
      setPalpites(prev => ({ ...prev, [campeaoId]: palps }));
    } catch {
      setErro('Erro ao atualizar palpite individual.');
    }
  };

  const statusBadge = (c: any) => {
    // Lógica simplificada de status visual
    const now = new Date();
    const limit = new Date(c.dataLimite);
    const definido = !!c.resultadoFinalId;
    const encerrado = now > limit;

    if (definido) return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">RESULTADO DEFINIDO</span>;
    if (encerrado) return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">PRAZO ENCERRADO</span>;
    return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">ABERTO</span>;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Gerenciar Campeões</h1>
          <p className="text-sm text-slate-500 font-medium">Configure as categorias e defina os vencedores.</p>
        </div>

        <div className="w-full md:w-auto min-w-[250px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bolão Selecionado</label>
          <select
            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-slate-500/20"
            value={bolaoId}
            onChange={async e => {
              if (!e.target.value) {
                setBolaoId('');
                setCampeoes([]);
                return;
              }
              setBolaoId(e.target.value);
              const selected = boloes.find(b => b.id === e.target.value);
              setTimes(selected?.times?.map((bt: any) => bt.time ?? bt) ?? []);
              await load(e.target.value, selected);
            }}
          >
            <option value="">Selecione um Bolão...</option>
            {boloes.map(b => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(sucesso || erro) && (
        <div className={`p-4 rounded-xl border ${sucesso ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {sucesso || erro}
        </div>
      )}

      {bolaoId && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna 1: Formulário de Criação/Edição */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sticky top-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                {editingId ? 'Editar Campeão' : 'Novo Campeão'}
              </h2>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Categoria</label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Ex: Campeão da Copa"
                    value={form.nome}
                    onChange={e => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Limite</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={form.dataLimite}
                    onChange={e => setForm({ ...form, dataLimite: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full bg-slate-800 text-white rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-slate-500/20"
                  >
                    {editingId ? 'Atualizar Dados' : 'Criar Categoria'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="w-full bg-white text-slate-600 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-slate-50 transition-colors"
                      onClick={() => {
                        setEditingId(null);
                        setForm({ nome: '', dataLimite: '' });
                      }}
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Coluna 2: Lista de Campeões */}
          <div className="lg:col-span-2 space-y-4">
            {campeoes.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">Nenhuma categoria cadastrada neste bolão.</p>
              </div>
            ) : (
              campeoes.map(c => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">

                  {/* Header do Card */}
                  <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-800">{c.nome}</h3>
                        {statusBadge(c)}
                      </div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        🕒 Limite: {new Date(c.dataLimite).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        🏆 Pontos: {c.pontuacao ?? c.bolao?.ptsCampeao} pts
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setForm({
                            nome: c.nome,
                            dataLimite: formatDateTimeLocal(c.dataLimite),
                          });
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setConfirmId(c.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Área de Definição de Resultado */}
                  <div className="p-4 bg-white border-b border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Definição do Resultado Oficial
                    </label>
                    <div className="flex gap-2">
                      <select
                        className={`flex-1 h-10 border rounded-lg px-3 text-sm font-medium outline-none focus:ring-2 transition-all ${c.resultadoFinalId ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-700 focus:ring-slate-500/20'
                          }`}
                        value={tempResults[c.id] ?? c.resultadoFinalId ?? ''}
                        onChange={e => setTempResults(prev => ({ ...prev, [c.id]: e.target.value }))}
                      >
                        <option value="">Aguardando definição...</option>
                        {times.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.nome}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDefinirResultado(c.id)}
                        disabled={savingResult === c.id || !tempResults[c.id] || tempResults[c.id] === c.resultadoFinalId}
                        className={`px-4 rounded-lg text-sm font-bold transition-all ${savingResult === c.id
                            ? 'bg-slate-100 text-slate-400 cursor-wait'
                            : tempResults[c.id] && tempResults[c.id] !== c.resultadoFinalId
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                      >
                        {savingResult === c.id ? 'Sal...' : 'Salvar'}
                      </button>
                    </div>
                    {c.resultadoFinalId && (
                      <p className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">
                        ✅ Resultado processado: {c.resultadoFinal?.nome}
                      </p>
                    )}
                  </div>

                  {/* Área de Palpites dos Usuários */}
                  <div className="p-4">
                    <details className="group">
                      <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
                        <span>Palpites dos Usuários ({palpites[c.id]?.length || 0})</span>
                        <span className="transform group-open:rotate-180 transition-transform duration-200">▼</span>
                      </summary>
                      <div className="mt-3 space-y-2 animate-fade-in pt-2 border-t border-slate-100">
                        {palpites[c.id]?.length ? (
                          palpites[c.id].map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="font-bold text-slate-700 block">{p.usuario?.nome}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.pontuacao > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                  {p.pontuacao ?? 0} pts
                                </span>
                              </div>
                              <select
                                className="w-32 md:w-48 h-8 text-xs border border-slate-200 rounded px-2 bg-white focus:border-blue-300 outline-none"
                                value={p.timeEscolhidoId || ''}
                                onChange={e => atualizarPalpiteAdmin(p.id, c.id, e.target.value)}
                              >
                                <option value="">Sem palpite</option>
                                {times.map(t => (
                                  <option key={t.id} value={t.id}>{t.nome}</option>
                                ))}
                              </select>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 italic">Nenhum palpite para esta categoria.</p>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {confirmId && (
        <ConfirmModal
          title="Confirmar exclusão"
          description="Esta ação removerá o campeão. Digite sua senha para confirmar."
          onCancel={() => setConfirmId(null)}
          onConfirm={async senha => {
            setConfirmId(null);
            try {
              await excluirCampeao(confirmId, senha);
              await load(bolaoId);
            } catch {
              setErro('Não foi possível excluir o campeão.');
            }
          }}
        />
      )}
    </div>
  );
}
