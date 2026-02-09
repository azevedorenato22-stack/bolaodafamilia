'use client';

import { useEffect, useState } from 'react';
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
          vencedorPenaltis: form.vencedorPenaltis || undefined,
          status: form.status,
        });
      } else {
        await criarJogo({
          ...form,
          dataHora: new Date(form.dataHora).toISOString(),
          resultadoCasa: form.resultadoCasa === '' ? undefined : Number(form.resultadoCasa),
          resultadoFora: form.resultadoFora === '' ? undefined : Number(form.resultadoFora),
          vencedorPenaltis: form.vencedorPenaltis || undefined,
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

  useEffect(() => {
    if (!form.bolaoId) return;
    if (rodadasDisponiveisComAtual.length === 0) return;

    const hasCurrent = rodadasDisponiveisComAtual.some((r: any) => r.id === form.rodadaId);
    if (!hasCurrent) {
      setForm(prev => ({ ...prev, rodadaId: rodadasDisponiveisComAtual[0].id }));
    }
  }, [form.bolaoId, rodadasDisponiveisComAtual, form.rodadaId]);

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
                const next: FiltersState = { ...filters, data: hoje, periodo: 'HOJE' };
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
                const next: FiltersState = { ...filters, data: '', periodo: 'FUTURO' };
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
              <option value="PALPITES">A realizar</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="ENCERRADO">Encerrados</option>
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
              <div key={j.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {j.timeCasa?.nome} x {j.timeFora?.nome}
                  </p>
                  <p className="text-sm text-gray-600">
                    {j.bolao?.nome} • {j.rodada?.nome} •{' '}
                    {new Date(j.dataHora).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {j.status} • Placar: {j.resultadoCasa ?? '-'} x {j.resultadoFora ?? '-'}
                    {j.mataMata && j.status === 'ENCERRADO' && j.vencedorPenaltis
                      ? ` • Pênaltis: ${j.vencedorPenaltis === 'CASA' ? 'Casa' : 'Fora'}`
                      : ''}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    className="text-primary-700 hover:text-primary-800"
                    onClick={() => {
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
                      // Scroll to form if needed, or simple enough to just be there.
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="text-sm text-red-600 hover:text-red-700"
                    onClick={() => setConfirmId(j.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
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
      <form onSubmit={submit} className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
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
              <option value="">Escolher bolão</option>
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
              <option value="EM_ANDAMENTO">Em andamento (Travado)</option>
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
              disabled={form.status !== 'ENCERRADO'}
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
              disabled={form.status !== 'ENCERRADO'}
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
                disabled={form.status !== 'ENCERRADO'}
              >
                <option value="">Selecione</option>
                <option value="CASA">Casa</option>
                <option value="FORA">Fora</option>
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
