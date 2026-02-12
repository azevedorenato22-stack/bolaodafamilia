'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import { criarTime, excluirTime, listarTimes, atualizarTime, listarCategorias, excluirCategoria } from '../../../services/times.service';
import { ConfirmModal } from '../../../components/confirm-modal';

export default function AdminTimesPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [times, setTimes] = useState<any[]>([]);
  const [todasCategorias, setTodasCategorias] = useState<string[]>([]);

  const [form, setForm] = useState<{
    nome: string;
    categorias: string[];
  }>({
    nome: '',
    categorias: [],
  });

  const [novaCategoria, setNovaCategoria] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([listarTimes(), listarCategorias()])
      .then(([timesData, categoriasData]) => {
        setTimes(timesData);
        setTodasCategorias(categoriasData);
      })
      .catch(() => setErro('Falha ao carregar dados.'));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setIsSaving(true);
    const isEditing = Boolean(editingId);

    // Validação básica
    if (!form.categorias || form.categorias.length === 0) {
      setErro('Selecione pelo menos uma categoria.');
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        nome: form.nome,
        categorias: form.categorias
      };

      if (editingId) {
        await atualizarTime(editingId, payload);
      } else {
        await criarTime(payload);
      }
      setSucesso(isEditing ? 'Time atualizado com sucesso.' : 'Time criado com sucesso.');
      setEditingId(null);
      setForm({ nome: '', categorias: [] });
      setNovaCategoria('');

      // Recarregar dados
      const [novosTimes, novasCategorias] = await Promise.all([listarTimes(), listarCategorias()]);
      setTimes(novosTimes);
      setTodasCategorias(novasCategorias);
      setFiltroCategoria('Todas');
    } catch {
      setErro(isEditing ? 'Erro ao atualizar time.' : 'Erro ao criar time.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, senha: string) => {
    try {
      await excluirTime(id, senha);
      setTimes(await listarTimes());
    } catch {
      setErro('Não foi possível excluir (provavelmente vinculado a jogos/bolões).');
    }
  };

  const handleExcluirCategoria = async (cat: string) => {
    if (!confirm(`Deseja excluir a categoria "${cat}"?`)) return;
    try {
      await excluirCategoria(cat);
      setSucesso(`Categoria "${cat}" removida.`);
      const cats = await listarCategorias();
      setTodasCategorias(cats);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao excluir categoria. Verifique se há times vinculados.');
    }
  };

  // Filtragem local
  const timesFiltrados = times
    .filter(t => filtroCategoria === 'Todas' || (t.categoria && t.categoria.includes(filtroCategoria))) // t.categoria é string "A, B"
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // Extrair categorias para o filtro (pode usar todasCategorias ou extrair dos times)
  const categoriasFiltro = Array.from(new Set(todasCategorias.concat(
    times.flatMap(t => t.categoria ? t.categoria.split(',').map((s: string) => s.trim()) : [])
  ))).sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Times</h1>
        <p className="text-sm text-gray-600">Cadastro global de times.</p>
      </div>
      {sucesso && <p className="text-sm text-green-700">{sucesso}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <form onSubmit={submit} className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
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
            <label className="text-sm font-medium mb-1 block">Categorias</label>
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto bg-slate-50 space-y-2">
              {todasCategorias.map(cat => (
                <div key={cat} className="group flex items-center justify-between gap-2 text-sm hover:bg-slate-100 p-1 rounded">
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={form.categorias?.includes(cat)}
                      onChange={e => {
                        const checked = e.target.checked;
                        setForm(prev => {
                          const atuais = prev.categorias || [];
                          if (checked) return { ...prev, categorias: [...atuais, cat] };
                          return { ...prev, categorias: atuais.filter(c => c !== cat) };
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{cat}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleExcluirCategoria(cat)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 px-1"
                    title="Excluir categoria"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                placeholder="Nova categoria..."
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
              />
              <button
                type="button"
                className="bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700"
                onClick={() => {
                  const val = novaCategoria.trim();
                  if (val && !todasCategorias.includes(val)) {
                    setTodasCategorias(prev => [...prev, val].sort());
                    setForm(prev => ({ ...prev, categorias: [...(prev.categorias || []), val] }));
                    setNovaCategoria('');
                  } else if (val && !form.categorias?.includes(val)) {
                    setForm(prev => ({ ...prev, categorias: [...(prev.categorias || []), val] }));
                    setNovaCategoria('');
                  }
                }}
                disabled={!novaCategoria.trim()}
              >
                Adicionar
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Selecione uma ou mais categorias.</p>
          </div>
        </div>

        <button
          type="submit"
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : editingId ? 'Atualizar time' : 'Criar time'}
        </button>
        {editingId && (
          <button
            type="button"
            className="text-sm text-gray-600 underline ml-2 disabled:opacity-50"
            onClick={() => {
              setEditingId(null);
              setForm({ nome: '', categorias: [] });
              setNovaCategoria('');
            }}
            disabled={isSaving}
          >
            Cancelar edição
          </button>
        )}
      </form>

      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 text-sm font-semibold text-gray-700 border-b flex items-center justify-between">
          <span>Times</span>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <label>Filtro:</label>
            <select
              className="border rounded-lg px-2 py-1"
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
            >
              <option value="Todas">Todas</option>
              {categoriasFiltro
                .map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {timesFiltrados.map(t => (
            <div key={t.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{t.nome}</p>
                <p className="text-sm text-gray-600">{t.categoria}</p>
              </div>
              <div className="flex items-center">
                <button
                  className="text-sm text-primary-700 hover:text-primary-800 mr-2"
                  onClick={() => {
                    setEditingId(t.id);
                    setForm({
                      nome: t.nome,
                      categorias: t.categoria ? t.categoria.split(',').map((s: string) => s.trim()) : [],
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-sm text-red-600 hover:text-red-700"
                  onClick={() => setConfirmId(t.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {timesFiltrados.length === 0 && <p className="p-4 text-sm text-gray-600">Nenhum time.</p>}
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          title="Confirmar exclusão"
          description="Esta ação removerá o time. Digite sua senha para confirmar."
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
