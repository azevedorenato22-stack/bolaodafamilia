'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '@/app/providers';
import { criarBolao, excluirBolao, listarBoloesAdmin, atualizarBolao, toggleBolaoAtivo } from '@/services/boloes.service';
import { listarTimes, listarCategorias } from '@/services/times.service';
import { listarRodadas } from '@/services/rodadas.service';
import { ConfirmModal } from '@/components/confirm-modal';
import { listarUsuarios } from '@/services/usuarios.service';

export default function AdminBoloesPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [boloes, setBoloes] = useState<any[]>([]);
  const [times, setTimes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [rodadas, setRodadas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const emptyForm = () => ({
    nome: '',
    descricao: '',
    dataFim: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    ativo: true,
    pts_resultado_exato: 25,
    pts_vencedor_gols: 18,
    pts_diferenca_gols: 15,
    pts_empate: 15,
    pts_placar_perdedor: 12,
    pts_vencedor: 10,
    pts_penaltis: 5,
    timeIds: [] as string[],
    rodadaIds: [] as string[],
    usuarioIds: [] as string[],
  });
  const [form, setForm] = useState(emptyForm());

  const sortBoloes = (list: any[]) => [...list].sort((a, b) => {
    if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, tData, rData, uData, cData] = await Promise.all([
        listarBoloesAdmin(),
        listarTimes(),
        listarRodadas(),
        listarUsuarios(),
        listarCategorias(),
      ]);
      setBoloes(sortBoloes(bData));
      setTimes(tData);
      setRodadas(rData);
      setUsuarios(uData.filter((u: any) => u.tipo === 'USUARIO'));
      setCategorias(cData);
    } catch {
      setError('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    setError(null);
    setSucesso(null);
    setIsSaving(true);
    try {
      if (editingId) {
        await atualizarBolao(editingId, form);
      } else {
        await criarBolao(form);
      }
      await loadData();
      setSucesso(editingId ? 'Bolão atualizado com sucesso!' : 'Bolão criado com sucesso!');
      setTimeout(() => {
        setMode('list');
        setEditingId(null);
        setForm(emptyForm());
        setSucesso(null);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar bolão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, senha: string) => {
    try {
      await excluirBolao(id, senha);
      await loadData();
    } catch {
      setError('Não foi possível excluir o bolão.');
    }
  };

  const handleEdit = (b: any) => {
    setEditingId(b.id);
    setMode('edit');
    setForm({
      nome: b.nome,
      descricao: b.descricao ?? '',
      dataFim: b.dataFinal?.slice(0, 10) ?? '',
      ativo: b.ativo ?? true,
      pts_resultado_exato: b.ptsResultadoExato ?? 25,
      pts_vencedor_gols: b.ptsVencedorGols ?? 18,
      pts_diferenca_gols: b.ptsDiferencaGols ?? 15,
      pts_empate: b.ptsEmpate ?? 15,
      pts_placar_perdedor: b.ptsPlacarPerdedor ?? 12,
      pts_vencedor: b.ptsVencedor ?? 10,
      pts_penaltis: b.ptsPenaltis ?? 5,
      timeIds: b.times?.map((t: any) => t.id) ?? [],
      rodadaIds: b.rodadas?.map((r: any) => r.id) ?? [],
      usuarioIds: b.participantes?.map((u: any) => u.id) ?? [],
    });
  };

  const handleAutoSelectByCategoria = (catNome: string) => {
    // Pegar times que pertencem a essa categoria
    const timesDaCat = times.filter((t: any) =>
      t.categorias?.some((c: any) => c.categoria.nome === catNome) || t.categoria === catNome
    );
    const idsDaCat = timesDaCat.map(t => t.id);

    // Se TODOS da categoria já estão selecionados, desseleciona eles
    const todosSelecionados = idsDaCat.every(id => form.timeIds.includes(id));

    if (todosSelecionados) {
      setForm({ ...form, timeIds: form.timeIds.filter(id => !idsDaCat.includes(id)) });
    } else {
      // Se não, adiciona os que faltam
      const novosIds = Array.from(new Set([...form.timeIds, ...idsDaCat]));
      setForm({ ...form, timeIds: novosIds });
    }
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bolões</h1>
        {mode === 'list' ? (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            onClick={() => { setMode('create'); setForm(emptyForm()); setEditingId(null); }}
          >
            + Novo Bolão
          </button>
        ) : (
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={() => { setMode('list'); setEditingId(null); setForm(emptyForm()); }}
          >
            ← Voltar
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {sucesso && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{sucesso}</div>}

      {mode !== 'list' ? (
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Editar Bolão' : 'Novo Bolão'}</h2>

          <div className="grid md:grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
              />
            </div>
          </div>

          <h3 className="text-md font-semibold pt-4">Pontuação</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'pts_resultado_exato', label: 'Placar Exato (PE)' },
              { key: 'pts_vencedor_gols', label: 'Vencedor + Placar (PV)' },
              { key: 'pts_diferenca_gols', label: 'Dif. Gols (DG)' },
              { key: 'pts_empate', label: 'Empate (EM)' },
              { key: 'pts_placar_perdedor', label: 'Placar Perdedor (PP)' },
              { key: 'pts_vencedor', label: 'Vencedor Simples (VS)' },
              { key: 'pts_penaltis', label: 'Pênaltis' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-700">{label}</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={(form as any)[key] ?? 0}
                  onChange={e => setForm({ ...form, [key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <h3 className="text-md font-semibold">Times do Bolão</h3>
            <div className="flex gap-2 items-center overflow-x-auto pb-1 max-w-md md:max-w-none">
              <span className="text-xs text-gray-500 whitespace-nowrap">Marcar categoria:</span>
              {categorias.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleAutoSelectByCategoria(cat)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-colors whitespace-nowrap ${times.filter(t => (t.categorias?.some((c: any) => c.categoria.nome === cat) || t.categoria === cat))
                    .every(t => form.timeIds.includes(t.id))
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
            {times.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum time cadastrado.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {times.map((t: any) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.timeIds.includes(t.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({ ...form, timeIds: [...form.timeIds, t.id] });
                        } else {
                          setForm({ ...form, timeIds: form.timeIds.filter(id => id !== t.id) });
                        }
                      }}
                    />
                    {t.nome}
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {form.timeIds.length} time(s) selecionado(s)
          </p>

          <h3 className="text-md font-semibold pt-4">Rodadas do Bolão</h3>
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
            {rodadas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma rodada cadastrada.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {rodadas.map((r: any) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.rodadaIds.includes(r.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({ ...form, rodadaIds: [...form.rodadaIds, r.id] });
                        } else {
                          setForm({ ...form, rodadaIds: form.rodadaIds.filter(id => id !== r.id) });
                        }
                      }}
                    />
                    {r.nome}
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {form.rodadaIds.length} rodada(s) selecionada(s)
          </p>

          <h3 className="text-md font-semibold pt-4">Participantes (Usuários)</h3>
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50">
            {usuarios.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum usuário disponível.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {usuarios.map((u: any) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1 rounded">
                    <input
                      type="checkbox"
                      checked={form.usuarioIds.includes(u.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({ ...form, usuarioIds: [...form.usuarioIds, u.id] });
                        } else {
                          setForm({ ...form, usuarioIds: form.usuarioIds.filter(id => id !== u.id) });
                        }
                      }}
                    />
                    <span className="truncate">{u.nome || u.usuario}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {form.usuarioIds.length} participante(s) selecionado(s)
          </p>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={e => setForm({ ...form, ativo: e.target.checked })}
            />
            <label htmlFor="ativo" className="text-sm">Ativo</label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
            </button>
            <button
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
              onClick={() => { setMode('list'); setEditingId(null); setForm(emptyForm()); }}
              disabled={isSaving}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="divide-y">
            {boloes.map(b => (
              <div key={b.id} className={`p-4 flex justify-between items-center ${!b.ativo ? 'bg-gray-50 opacity-60' : ''}`}>
                <div>
                  <div className="font-medium">{b.nome}</div>
                  <div className="text-xs text-gray-500">
                    {b.times?.length ?? 0} times • {b.rodadas?.length ?? 0} rodadas • {b.participantes?.length ?? 0} participantes
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => handleEdit(b)}
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
            {boloes.length === 0 && <p className="p-4 text-sm text-gray-600">Nenhum bolão cadastrado.</p>}
          </div>
        </div>
      )}

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
