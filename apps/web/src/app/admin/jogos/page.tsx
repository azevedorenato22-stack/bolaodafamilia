'use client';

import { useEffect, useState, useRef } from 'react';
import { useProtectedPage } from '../../providers';
import { listarBoloesAdmin } from '../../../services/boloes.service';
import { listarRodadas } from '../../../services/rodadas.service';
import { listarTimes } from '../../../services/times.service';
import { criarJogo, excluirJogo, listarJogos, atualizarJogo } from '../../../services/jogos.service';
import { ConfirmModal } from '../../../components/confirm-modal';
import { StatusJogo } from '@prisma/client';

export default function AdminJogosPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [boloes, setBoloes] = useState<any[]>([]);
  const [rodadas, setRodadas] = useState<any[]>([]);
  const [times, setTimes] = useState<any[]>([]);
  const [jogos, setJogos] = useState<any[]>([]);
  type PeriodoFiltro = '' | 'HOJE' | 'FUTURO';
  type FiltersState = {
    bolaoId: string;
    rodadaId: string;
    status: StatusJogo | '';
    data: string;
    periodo: PeriodoFiltro;
  };
  const initialFilters: FiltersState = {
    bolaoId: '',
    rodadaId: '',
    status: '',
    data: '',
    periodo: '',
  };
  const emptyForm = () => ({
    bolaoId: '',
    rodadaId: '',
    timeCasaId: '',
    timeForaId: '',
    dataHora: '',
    mataMata: false,
    status: 'PALPITES' as StatusJogo,
    resultadoCasa: '',
    resultadoFora: '',
    vencedorPenaltis: '',
  });
  const [form, setForm] = useState(emptyForm());
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const formRef = useRef<HTMLFormElement>(null);

  const sortByName = (lista: any[]) =>
    [...lista].sort((a, b) => a.nome.localeCompare(b.nome));

  useEffect(() => {
    Promise.all([listarBoloesAdmin(), listarRodadas(), listarTimes()])
      .then(([b, r, t]) => {
        const ativos = sortByName(b.filter((bolao: any) => bolao.ativo));
        setBoloes(ativos);
        setRodadas(r);
        setTimes(t);
      })
      .catch(() => setErro('Falha ao carregar dados.'));
  }, []);

  const formatDateForInput = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  };

  const formatDateTimeForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const hasActiveFilters = (f: FiltersState) =>
    Boolean(f.bolaoId || f.rodadaId || f.status || f.data || f.periodo);

  const loadJogos = async (override?: FiltersState) => {
    const activeFilters = override ?? filters;
    const shouldLoad = hasActiveFilters(activeFilters);
    if (!shouldLoad) {
      setJogos([]);
      return;
    }
    setErro(null);
    try {
      const params: any = {};
      params.tzOffset = new Date().getTimezoneOffset();
      if (activeFilters.bolaoId) params.bolaoId = activeFilters.bolaoId;
      if (activeFilters.rodadaId) params.rodadaId = activeFilters.rodadaId;
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.data) params.data = activeFilters.data;
      if (activeFilters.periodo) params.periodo = activeFilters.periodo;
      const lista = await listarJogos(params);
      setJogos(lista);
    } catch {
      setErro('Falha ao carregar jogos.');
    }
  };

  const resetEdicao = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setIsSaving(true);
    const isEditing = Boolean(editingId);
    try {
      if (editingId) {
        await atualizarJogo(editingId, {
          ...form,
          dataHora: new Date(form.dataHora).toISOString(),
          resultadoCasa: form.resultadoCasa === '' ? undefined : Number(form.resultadoCasa),
          resultadoFora: form.resultadoFora === '' ? undefined : Number(form.resultadoFora),
          vencedorPenaltis: form.vencedorPenaltis || null,
          status: form.status,
        });
      } else {
        await criarJogo({
          ...form,
          dataHora: new Date(form.dataHora).toISOString(),
          resultadoCasa: form.resultadoCasa === '' ? undefined : Number(form.resultadoCasa),
          resultadoFora: form.resultadoFora === '' ? undefined : Number(form.resultadoFora),
          vencedorPenaltis: form.vencedorPenaltis || null,
          status: form.status,
        });
      }
      await loadJogos();
      setSucesso(isEditing ? 'Jogo atualizado com sucesso.' : 'Jogo criado com sucesso.');
      resetEdicao();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao criar/atualizar jogo.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, senha: string) => {
    setErro(null);
    setSucesso(null);
    try {
      await excluirJogo(id, true, senha);
      await loadJogos();
      setSucesso('Jogo excluído com sucesso.');
    } catch {
      setErro('Não foi possível excluir jogo.');
    }
  };

  const bolaoSelecionado = boloes.find(b => b.id === form.bolaoId);
  const rodadasDoBolaoSelecionado = bolaoSelecionado?.rodadas ?? [];
  const rodadasDisponiveis =
    rodadasDoBolaoSelecionado.length > 0 ? rodadasDoBolaoSelecionado : rodadas;
  const rodadasDisponiveisComAtual =
    form.rodadaId && !rodadasDisponiveis.some((r: any) => r.id === form.rodadaId)
      ? rodadasDisponiveis.concat(rodadas.filter((r: any) => r.id === form.rodadaId))
      : rodadasDisponiveis;

  const bolaoFiltro = boloes.find(b => b.id === filters.bolaoId);
  const rodadasFiltroBase = bolaoFiltro?.rodadas ?? [];
  const rodadasFiltro =
    rodadasFiltroBase.length > 0 ? rodadasFiltroBase : rodadas;
  const rodadasFiltroComSelecionada =
    filters.rodadaId && !rodadasFiltro.some((r: any) => r.id === filters.rodadaId)
      ? rodadasFiltro.concat(rodadas.filter((r: any) => r.id === filters.rodadaId))
      : rodadasFiltro;

  // useEffect(() => {
  //   if (!form.bolaoId) return;
  //   if (rodadasDisponiveisComAtual.length === 0) return;

  //   const hasCurrent = rodadasDisponiveisComAtual.some((r: any) => r.id === form.rodadaId);
  //   if (!hasCurrent) {
  //     setForm(prev => ({ ...prev, rodadaId: rodadasDisponiveisComAtual[0].id }));
  //   }
  // }, [form.bolaoId, rodadasDisponiveisComAtual, form.rodadaId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Jogos</h1>
        <p className="text-sm text-gray-600">Cadastro vinculado a bolão e rodada.</p>
      </div>
      {sucesso && <p className="text-sm text-green-700">{sucesso}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {/* FILTROS (Movi para cima conforme solicitado) */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 text-sm font-semibold text-gray-700 border-b">Jogos e Filtros</div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Filtros rápidos
            </span>
            <button
              type="button"
              className={`rounded-md border px-2 py-1 text-sm ${filters.periodo === 'HOJE'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              onClick={async () => {
                const hoje = formatDateForInput(new Date());
                const next: FiltersState = { ...filters, data: hoje, periodo: 'HOJE', status: '', rodadaId: '' };
                setFilters(next);
                await loadJogos(next);
              }}
            >
              Jogos do Dia
            </button>
            <button
              type="button"
              className={`rounded-md border px-2 py-1 text-sm ${filters.periodo === 'FUTURO'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              onClick={async () => {
                const next: FiltersState = { ...filters, data: '', periodo: 'FUTURO', status: '', rodadaId: '' };
                setFilters(next);
                await loadJogos(next);
              }}
            >
              Jogos a Realizar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="border rounded-lg px-2 py-1 text-sm"
              value={filters.bolaoId}
              onChange={async e => {
                const next = { ...filters, bolaoId: e.target.value, rodadaId: '' };
                setFilters(next);
                await loadJogos(next);
              }}
            >
              <option value="">Todos os bolões</option>
              {boloes.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
            <select
              className="border rounded-lg px-2 py-1 text-sm"
              value={filters.rodadaId}
              onChange={async e => {
                const next = { ...filters, rodadaId: e.target.value };
                setFilters(next);
                await loadJogos(next);
              }}
            >
              <option value="">Todas rodadas</option>
              {rodadasFiltroComSelecionada.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
            <select
              className="border rounded-lg px-2 py-1 text-sm"
              value={filters.status}
              onChange={async e => {
                const next: FiltersState = {
                  ...filters,
                  status: e.target.value as FiltersState['status'],
                };
                setFilters(next);
                await loadJogos(next);
              }}
            >
              <option value="">Todos status</option>
              <option value="PALPITES">Aberto / Palpites</option>
              <option value="FECHADO">Fechado (Aguardando jogo)</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
            <input
              type="date"
              className="border rounded-lg px-2 py-1 text-sm"
              value={filters.data}
              onChange={async e => {
                const next: FiltersState = { ...filters, data: e.target.value, periodo: '' };
                setFilters(next);
                await loadJogos(next);
              }}
            />
            <button
              type="button"
              className="text-sm text-gray-600 underline"
              onClick={async () => {
                setFilters(initialFilters);
                setJogos([]);
              }}
            >
              Limpar filtros
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {jogos.map(j => (
              <AdminJogoItem
                key={j.id}
                jogo={j}
                onRefresh={() => loadJogos(filters)}
                onEdit={() => {
                  setErro(null);
                  setSucesso(null);
                  setEditingId(j.id);
                  setForm({
                    bolaoId: j.bolaoId,
                    rodadaId: j.rodadaId,
                    timeCasaId: j.timeCasaId,
                    timeForaId: j.timeForaId,
                    dataHora: formatDateTimeForInput(j.dataHora),
                    mataMata: j.mataMata,
                    status: j.status,
                    resultadoCasa:
                      j.resultadoCasa === null || j.resultadoCasa === undefined
                        ? ''
                        : String(j.resultadoCasa),
                    resultadoFora:
                      j.resultadoFora === null || j.resultadoFora === undefined
                        ? ''
                        : String(j.resultadoFora),
                    vencedorPenaltis: j.vencedorPenaltis ?? '',
                  });
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                onDelete={() => setConfirmId(j.id)}
              />
            ))}
            {jogos.length === 0 && (
              <p className="p-4 text-sm text-gray-600">
                {hasActiveFilters(filters)
                  ? 'Nenhum jogo.'
                  : 'Selecione um filtro para listar os jogos.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* FORMULÁRIO (Agora abaixo da lista) */}
      <h2 className="text-lg font-semibold text-gray-800 pt-4">
        {editingId ? 'Editar Jogo' : 'Cadastrar Jogo'}
      </h2>
      <form ref={formRef} onSubmit={submit} className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Bolão</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.bolaoId}
              onChange={e =>
                setForm({
                  ...form,
                  bolaoId: e.target.value,
                  timeCasaId: '',
                  timeForaId: '',
                  rodadaId: '',
                })
              }
            >
              <option value="">Escolha um bolão...</option>
              {boloes.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Rodada</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.rodadaId}
              onChange={e => setForm({ ...form, rodadaId: e.target.value })}
            >
              <option value="">Escolha uma rodada...</option>
              {rodadasDisponiveisComAtual.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Time casa</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.timeCasaId}
              onChange={e => setForm({ ...form, timeCasaId: e.target.value })}
            >
              <option value="">Selecione</option>
              {times
                .filter(t =>
                  boloes
                    .find(b => b.id === form.bolaoId)
                    ?.times?.some((bt: any) => bt.id === t.id || bt.time?.id === t.id || bt.timeId === t.id),
                )
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Time fora</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.timeForaId}
              onChange={e => setForm({ ...form, timeForaId: e.target.value })}
            >
              <option value="">Selecione</option>
              {times
                .filter(t =>
                  boloes
                    .find(b => b.id === form.bolaoId)
                    ?.times?.some((bt: any) => bt.id === t.id || bt.time?.id === t.id || bt.timeId === t.id),
                )
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Data e hora</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.dataHora}
              onChange={e => setForm({ ...form, dataHora: e.target.value })}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.mataMata}
              onChange={e => setForm({ ...form, mataMata: e.target.checked })}
            />
            Mata-mata (exige pênaltis em caso de empate)
          </label>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as StatusJogo })}
            >
              <option value="PALPITES">Aberto / Palpites</option>
              <option value="FECHADO">Fechado (Aguardando jogo)</option>
              <option value="ENCERRADO">Encerrado</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Placar casa</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.resultadoCasa}
              onChange={e => setForm({ ...form, resultadoCasa: e.target.value })}
              min={0}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Placar fora</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.resultadoFora}
              onChange={e => setForm({ ...form, resultadoFora: e.target.value })}
              min={0}
            />
          </div>
        </div>
        {form.mataMata && (
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Vencedor nos pênaltis</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.vencedorPenaltis}
                onChange={e => setForm({ ...form, vencedorPenaltis: e.target.value })}
              >
                <option value="">Selecione</option>
                <option value="CASA">Casa ({times.find(t => t.id === form.timeCasaId)?.nome || 'Mandante'})</option>
                <option value="FORA">Fora ({times.find(t => t.id === form.timeForaId)?.nome || 'Visitante'})</option>
              </select>
            </div>
            <div className="md:col-span-2 text-xs text-gray-600">
              Informe vencedor nos pênaltis apenas em caso de empate.
            </div>
          </div>
        )}
        <button
          type="submit"
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : editingId ? 'Atualizar jogo' : 'Criar jogo'}
        </button>
        {editingId && (
          <button
            type="button"
            className="text-sm text-gray-600 underline ml-3 disabled:opacity-50"
            onClick={resetEdicao}
            disabled={isSaving}
          >
            Cancelar edição
          </button>
        )}
      </form>

      {confirmId && (
        <ConfirmModal
          title="Confirmar exclusão"
          description="Esta ação removerá o jogo. Digite sua senha para confirmar."
          onCancel={() => setConfirmId(null)}
          onConfirm={senha => {
            setConfirmId(null);
            handleDelete(confirmId, senha);
          }}
        />
      )}
    </div>
  );
}

function AdminJogoItem({ jogo, onRefresh, onEdit, onDelete }: { jogo: any; onRefresh: () => void; onEdit: () => void; onDelete: () => void }) {
  const [showPalpites, setShowPalpites] = useState(false);
  const [palpites, setPalpites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPalpiteId, setEditingPalpiteId] = useState<string | null>(null);
  const [palpiteForm, setPalpiteForm] = useState({ golsCasa: '', golsFora: '', vencedorPenaltis: '' });

  const loadPalpites = async () => {
    setLoading(true);
    try {
      const { listarPalpitesDoJogo } = await import('../../../services/jogos.service');
      const data = await listarPalpitesDoJogo(jogo.id);
      setPalpites(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPalpite = (p: any) => {
    setEditingPalpiteId(p.id);
    setPalpiteForm({
      golsCasa: String(p.golsCasa),
      golsFora: String(p.golsFora),
      vencedorPenaltis: p.vencedorPenaltis || '',
    });
  };

  const savePalpite = async () => {
    if (!editingPalpiteId) return;
    try {
      const api = (await import('../../../lib/api')).default;
      await api.patch(`/api/palpites/${editingPalpiteId}/admin`, {
        golsCasa: Number(palpiteForm.golsCasa),
        golsFora: Number(palpiteForm.golsFora),
        vencedorPenaltis: palpiteForm.vencedorPenaltis || null,
      });
      setEditingPalpiteId(null);
      loadPalpites();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar palpite');
    }
  };

  return (
    <div className="py-4 border-b border-gray-100 last:border-0 relative">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-bold text-slate-800 flex items-center justify-between md:justify-start gap-2 text-lg">
            <span>
              {jogo.timeCasa?.nome} <span className="text-slate-300 font-light italic">vs</span> {jogo.timeFora?.nome}
            </span>
            <span className={`md:hidden px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${jogo.status === 'PALPITES' ? 'bg-green-500 text-white' :
              jogo.status === 'FECHADO' ? 'bg-amber-500 text-white' :
                'bg-slate-500 text-white'
              }`}>
              {jogo.status === 'PALPITES' ? 'Aberto' : jogo.status === 'FECHADO' ? 'Fechado' : 'Encerrado'}
            </span>
          </p>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 font-medium">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">{jogo.rodada?.nome}</span>
              <span>•</span>
              <span className="text-slate-400">{new Date(jogo.dataHora).toLocaleString('pt-BR')}</span>
            </div>

            {(jogo.mataMata || jogo.vencedorPenaltis) && (
              <div className="flex items-center gap-2">
                {jogo.mataMata && (
                  <span className="px-2 py-0.5 bg-slate-400 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                    Mata-Mata
                  </span>
                )}
                {jogo.vencedorPenaltis && (
                  <span className="px-2 py-0.5 bg-slate-500 text-white rounded text-[9px] font-bold uppercase shadow-sm whitespace-nowrap">
                    Pên: {jogo.vencedorPenaltis === 'CASA' ? 'Casa' : 'Fora'}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-3 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl border border-slate-100 md:border-0 justify-between md:justify-start">
            <span className={`hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${jogo.status === 'PALPITES' ? 'bg-green-500 text-white' :
              jogo.status === 'FECHADO' ? 'bg-amber-500 text-white' :
                'bg-slate-500 text-white'
              }`}>
              {jogo.status === 'PALPITES' ? 'Aberto' : jogo.status === 'FECHADO' ? 'Fechado' : 'Encerrado'}
            </span>
            <div className="flex items-center flex-wrap gap-4 text-sm text-slate-800 w-full md:w-auto justify-between md:justify-start">
              <span className="font-bold">{jogo.timeCasa.nome}</span>
              <div className="flex items-center gap-1">
                <span className="bg-white md:bg-slate-100 border md:border-0 border-slate-200 px-3 py-1 rounded font-black min-w-[60px] text-center shadow-sm md:shadow-none">
                  {jogo.resultadoCasa ?? '-'} x {jogo.resultadoFora ?? '-'}
                </span>
              </div>
              <span className="font-bold">{jogo.timeFora.nome}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-2 md:flex">
            <button
              className="text-[10px] md:text-[11px] font-black uppercase tracking-wider bg-[#64748B] text-white px-3 py-2 md:py-1.5 rounded-lg shadow-sm hover:bg-[#475569] transition-colors flex items-center justify-center"
              onClick={onEdit}
            >
              Editar
            </button>
            <button
              className="text-[10px] md:text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100 px-3 py-2 md:py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
              onClick={onDelete}
            >
              Excluir
            </button>
          </div>
          <button
            className="w-full text-[10px] md:text-[11px] font-black uppercase tracking-wider bg-[#2563EB] text-white border border-[#2563EB] px-3 py-2 md:py-1.5 rounded-lg hover:bg-[#1D4ED8] hover:border-[#1D4ED8] transition-colors text-center"
            onClick={() => {
              setShowPalpites(!showPalpites);
              if (!showPalpites) loadPalpites();
            }}
          >
            {showPalpites ? 'Ocultar Palpites' : 'Ver Palpites'}
          </button>
        </div>
      </div>

      {showPalpites && (
        <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
          <div className="px-4 py-3 border-b border-slate-200 bg-white/50 flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Palpites dos Usuários</h4>
            {loading && <span className="text-[10px] text-blue-500 animate-pulse font-bold">CARREGANDO...</span>}
          </div>
          <div className="divide-y divide-slate-100">
            {palpites.length === 0 && !loading ? (
              <div className="p-8 text-center text-slate-400 text-sm italic font-medium">Nenhum palpite cadastrado.</div>
            ) : (
              palpites.map(p => (
                <div key={p.id} className="p-3 flex flex-col sm:flex-row items-center justify-between hover:bg-white/80 transition-colors gap-3 border-b border-dashed border-slate-100 last:border-0">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs uppercase shrink-0">
                      {p.usuario.nome?.slice(0, 2)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-slate-700 text-sm truncate">{p.usuario.nome}</span>
                      <span className="text-[9px] text-slate-400 font-mono">ID: {p.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  {editingPalpiteId === p.id ? (
                    <div className="flex flex-wrap items-center justify-center gap-2 bg-white p-2 rounded-xl border-2 border-primary-200 shadow-xl z-20 w-full sm:w-auto">
                      <input
                        type="number"
                        className="w-10 border rounded px-1 py-1 text-center text-sm"
                        value={palpiteForm.golsCasa}
                        onChange={e => setPalpiteForm({ ...palpiteForm, golsCasa: e.target.value })}
                      />
                      <span className="text-slate-300 font-black text-xs">X</span>
                      <input
                        type="number"
                        className="w-10 border rounded px-1 py-1 text-center text-sm"
                        value={palpiteForm.golsFora}
                        onChange={e => setPalpiteForm({ ...palpiteForm, golsFora: e.target.value })}
                      />
                      {jogo.mataMata && (
                        <select
                          className="text-[10px] font-bold border-2 border-slate-200 rounded-lg px-1 h-8 bg-slate-50 text-slate-700 max-w-[100px]"
                          value={palpiteForm.vencedorPenaltis}
                          onChange={e => setPalpiteForm({ ...palpiteForm, vencedorPenaltis: e.target.value })}
                        >
                          <option value="">-</option>
                          <option value="CASA">Casa</option>
                          <option value="FORA">Fora</option>
                        </select>
                      )}
                      <div className="flex gap-1 ml-1">
                        <button className="bg-primary-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase" onClick={savePalpite}>OK</button>
                        <button className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-[10px] font-bold uppercase" onClick={() => setEditingPalpiteId(null)}>X</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <div className="text-center">
                        <div className="text-sm font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 flex items-center justify-center gap-2 min-w-[80px]">
                          <span>{p.golsCasa} <span className="text-slate-300 font-light mx-0.5">x</span> {p.golsFora}</span>
                          {p.vencedorPenaltis && (
                            <span className="text-[9px] text-purple-600 font-black uppercase bg-purple-50 px-1 rounded border border-purple-100 whitespace-nowrap">
                              P: {p.vencedorPenaltis === 'CASA' ? 'C' : 'F'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right flex flex-col items-end min-w-[60px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${p.pontuacao > 0 ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                            }`}>
                            +{p.pontuacao} pts
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-bold">
                            {p.pontosJogo}J + {p.pontosPenaltis}P
                          </span>
                        </div>
                        <button
                          className="text-slate-400 hover:text-primary-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
                          title="Editar Palpite"
                          onClick={() => handleEditPalpite(p)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
