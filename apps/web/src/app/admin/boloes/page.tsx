'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import { criarBolao, excluirBolao, listarBoloesAdmin, atualizarBolao, toggleBolaoAtivo } from '../../../services/boloes.service';
import { listarTimes } from '../../../services/times.service';
import { listarRodadas } from '../../../services/rodadas.service';
import { ConfirmModal } from '../../../components/confirm-modal';
import { listarUsuarios } from '../../../services/usuarios.service';

export default function AdminBoloesPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [boloes, setBoloes] = useState<any[]>([]);
  const [times, setTimes] = useState<any[]>([]);
  const [rodadas, setRodadas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const emptyForm = () => ({
    nome: '',
    descricao: '',
    dataFim: '',
    ativo: true,
    pts_resultado_exato: 10,
    pts_vencedor_gols: 6,
    pts_vencedor: 3,
    pts_gols_time: 2,
    pts_campeao: 20,
    pts_penaltis: 1,
    timeIds: [] as string[],
    rodadaIds: [] as string[],
    usuarioIds: [] as string[],
  });
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [erro, setErro] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, t, r, u] = await Promise.all([
        listarBoloesAdmin(),
        listarTimes(),
        listarRodadas(),
        listarUsuarios(),
      ]);
      setBoloes(sortBoloes(b));
      setTimes(t);
      setRodadas(r);
      setUsuarios(u);
    } catch {
      setErro('Falha ao carregar bolões/times/rodadas/usuários.');
    }
  };

  const sortBoloes = (lista: any[]) => {
    return [...lista].sort((a, b) => {
      // Ordena por Ativo (True primeiro) e depois Nome
      if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    });
  };

  const usuariosDisponiveis = [...usuarios]
    .filter((u: any) => u.tipo === 'USUARIO' && u.ativo)
    .sort((a: any, b: any) => a.nome.localeCompare(b.nome));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    try {
      if (editingId) {
        await atualizarBolao(editingId, { ...form, dataFim: form.dataFim });
      } else {
        await criarBolao({ ...form, dataFim: form.dataFim });
      }

      // Recarregar lista explicitamente
      const b = await listarBoloesAdmin();
      setBoloes(sortBoloes(b));

      alert(editingId ? 'Bolão atualizado.' : 'Bolão criado.');
      setForm(emptyForm());
      setEditingId(null);
      setMode('list');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao criar/atualizar bolão.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleDelete = async (id: string, senha: string) => {
    try {
      await excluirBolao(id, senha);
      const b = await listarBoloesAdmin();
      setBoloes(sortBoloes(b));
    } catch {
      alert('Não foi possível excluir.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bolões</h1>
        <p className="text-sm text-gray-600">Cadastrar, listar e excluir bolões.</p>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {mode !== 'list' && (
        <form onSubmit={submit} className="space-y-4 border border-gray-200 rounded-xl p-4 bg-white">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data final</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.dataFim}
                onChange={e => setForm({ ...form, dataFim: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativoBolao"
              checked={form.ativo}
              onChange={e => setForm({ ...form, ativo: e.target.checked })}
            />
            <label htmlFor="ativoBolao" className="text-sm font-medium">Ativo</label>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              ['pts_resultado_exato', 'Placar Exato'],
              ['pts_vencedor_gols', 'Placar do Vencedor'],
              ['pts_vencedor', 'Diferença de Gols e Empate'],
              ['pts_gols_time', 'Placar do Perdedor'],
              ['pts_campeao', 'Vencedor Simples'],
              ['pts_penaltis', 'Pênaltis'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="text-sm font-medium">{label}</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={(form as any)[key]}
                  onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium">Times do bolão</label>
            <div className="flex gap-2 mb-2">
              <select
                className="border rounded-lg px-2 py-1 text-sm"
                onChange={e => {
                  const cat = e.target.value;
                  if (!cat) return;
                  const ids = times.filter(t => t.categoria === cat).map(t => t.id);
                  const set = new Set(form.timeIds.concat(ids));
                  setForm({ ...form, timeIds: Array.from(set) });
                }}
              >
                <option value="">Selecionar por categoria</option>
                {[...new Set(times.map((t: any) => t.categoria))].map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="text-sm text-gray-600 underline"
                onClick={() => setForm({ ...form, timeIds: [] })}
              >
                Limpar seleção
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {times.map(t => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.timeIds.includes(t.id)}
                    onChange={e => {
                      const set = new Set(form.timeIds);
                      e.target.checked ? set.add(t.id) : set.delete(t.id);
                      setForm({ ...form, timeIds: Array.from(set) });
                    }}
                  />
                  {t.nome} <span className="text-gray-500 text-xs">({t.categoria})</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Rodadas do bolão</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className="text-sm text-gray-600 underline"
                onClick={() => setForm({ ...form, rodadaIds: rodadas.map((r: any) => r.id) })}
              >
                Selecionar todas
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 underline"
                onClick={() => setForm({ ...form, rodadaIds: [] })}
              >
                Limpar seleção
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {rodadas.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.rodadaIds.includes(r.id)}
                    onChange={e => {
                      const set = new Set(form.rodadaIds);
                      e.target.checked ? set.add(r.id) : set.delete(r.id);
                      setForm({ ...form, rodadaIds: Array.from(set) });
                    }}
                  />
                  {r.nome}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Participantes (usuários)</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className="text-sm text-gray-600 underline"
                onClick={() =>
                  setForm({ ...form, usuarioIds: usuariosDisponiveis.map((u: any) => u.id) })
                }
              >
                Selecionar todos
              </button>
              <button
                type="button"
                className="text-sm text-gray-600 underline"
                onClick={() => setForm({ ...form, usuarioIds: [] })}
              >
                Limpar seleção
              </button>
              <span className="text-xs text-gray-500 self-center">
                Selecionados: {form.usuarioIds.length}
              </span>
            </div>
            {form.usuarioIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.usuarioIds.map(id => {
                  const u = usuarios.find((x: any) => x.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs"
                    >
                      <span className="text-gray-800">{u?.nome || id}</span>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700 font-semibold"
                        onClick={() =>
                          setForm({
                            ...form,
                            usuarioIds: form.usuarioIds.filter(uid => uid !== id),
                          })
                        }
                      >
                        Remover
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
              {usuariosDisponiveis.map(u => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.usuarioIds.includes(u.id)}
                    onChange={e => {
                      const set = new Set(form.usuarioIds);
                      e.target.checked ? set.add(u.id) : set.delete(u.id);
                      setForm({ ...form, usuarioIds: Array.from(set) });
                    }}
                  />
                  {u.nome} <span className="text-gray-500 text-xs">({u.usuario})</span>
                </label>
              ))}
              {usuariosDisponiveis.length === 0 && (
                <p className="text-sm text-gray-600">Nenhum usuário ativo disponível.</p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700"
          >
            {editingId ? 'Atualizar bolão' : 'Criar bolão'}
          </button>
          <button
            type="button"
            className="text-sm text-gray-600 underline ml-2"
            onClick={() => {
              setEditingId(null);
              setMode('list');
              setForm(emptyForm());
            }}
          >
            Cancelar
          </button>
        </form>
      )}

      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 text-sm font-semibold text-gray-700 border-b flex items-center justify-between">
          <span>Bolões existentes</span>
          {mode === 'list' && (
            <button
              className="text-sm text-primary-700 hover:text-primary-800 font-semibold"
              onClick={() => {
                setEditingId(null);
                setMode('create');
                setForm(emptyForm());
              }}
            >
              Criar bolão
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {boloes.map(b => (
            <div key={b.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {b.nome}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.ativo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                  >
                    {b.ativo ? 'Ativo' : 'Desativado'}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Final: {new Date(b.dataFinal).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-3 text-sm items-center">
                <button
                  className="text-primary-700 hover:text-primary-800"
                  onClick={() => {
                    setEditingId(b.id);
                    setMode('edit');
                    setForm({
                      nome: b.nome,
                      descricao: b.descricao ?? '',
                      dataFim: b.dataFinal?.slice(0, 10) ?? '',
                      ativo: b.ativo ?? true,
                      pts_resultado_exato: b.ptsResultadoExato,
                      pts_vencedor_gols: b.ptsVencedorGols,
                      pts_vencedor: b.ptsVencedor,
                      pts_gols_time: b.ptsGolsTime,
                      pts_campeao: b.ptsCampeao,
                      pts_penaltis: b.ptsPenaltis ?? 1,
                      timeIds: b.times?.map((t: any) => t.id) ?? [],
                      rodadaIds: b.rodadas?.map((r: any) => r.id) ?? [],
                      usuarioIds: b.participantes?.map((u: any) => u.id) ?? [],
                    });
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-sm text-gray-700 hover:text-gray-900"
                  onClick={async () => {
                    try {
                      await toggleBolaoAtivo(b.id);
                      const novaLista = await listarBoloesAdmin();
                      setBoloes(sortBoloes(novaLista));
                    } catch {
                      alert('Não foi possível alterar o status.');
                    }
                  }}
                >
                  {b.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  className="text-sm text-red-600 hover:text-red-700"
                  onClick={() => setConfirmId(b.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {boloes.length === 0 && <p className="p-4 text-sm text-gray-600">Nenhum bolão.</p>}
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          title="Confirmar exclusão"
          description="Esta ação removerá o bolão. Digite sua senha para confirmar."
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
