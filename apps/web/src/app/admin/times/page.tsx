'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import { criarTime, excluirTime, listarTimes, atualizarTime } from '../../../services/times.service';
import { ConfirmModal } from '../../../components/confirm-modal';

export default function AdminTimesPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [times, setTimes] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: '', categoria: '', sigla: '', escudoUrl: '' });
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(''); // select value
  const [novaCategoria, setNovaCategoria] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    listarTimes()
      .then(setTimes)
      .catch(() => setErro('Falha ao carregar times.'));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setIsSaving(true);
    const isEditing = Boolean(editingId);
    try {
      const categoriaFinal =
        categoriaSelecionada === '__nova__' ? novaCategoria.trim() : categoriaSelecionada || form.categoria;

      const payload = { ...form, categoria: categoriaFinal };

      if (editingId) {
        await atualizarTime(editingId, payload);
      } else {
        await criarTime(payload);
      }
      setSucesso(isEditing ? 'Time atualizado com sucesso.' : 'Time criado com sucesso.');
      setEditingId(null);
      setForm({ nome: '', categoria: '', sigla: '', escudoUrl: '' });
      setCategoriaSelecionada('');
      setNovaCategoria('');
      setTimes(await listarTimes());
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
            <label className="text-sm font-medium">Categoria</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={categoriaSelecionada || form.categoria}
              onChange={e => {
                const val = e.target.value;
                setCategoriaSelecionada(val);
                if (val !== '__nova__') {
                  setForm({ ...form, categoria: val });
                  setNovaCategoria('');
                }
              }}
            >
              <option value="">Selecione</option>
              {Array.from(new Set(times.map(t => t.categoria)))
                .sort((a, b) => a.localeCompare(b))
                .map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              <option value="__nova__">+ Nova categoria...</option>
            </select>
            {categoriaSelecionada === '__nova__' && (
              <input
                className="mt-2 w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Digite a nova categoria"
                value={novaCategoria}
                onChange={e => {
                  setNovaCategoria(e.target.value);
                  setForm({ ...form, categoria: e.target.value });
                }}
                required
              />
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Sigla</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.sigla}
              onChange={e => setForm({ ...form, sigla: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Escudo URL</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.escudoUrl}
              onChange={e => setForm({ ...form, escudoUrl: e.target.value })}
            />
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
              setForm({ nome: '', categoria: '', sigla: '', escudoUrl: '' });
              setCategoriaSelecionada('');
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
              {Array.from(new Set(times.map(t => t.categoria)))
                .sort((a, b) => a.localeCompare(b))
                .map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {times
            .filter(t => filtroCategoria === 'Todas' || t.categoria === filtroCategoria)
            .slice()
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t.nome}</p>
                  <p className="text-sm text-gray-600">{t.categoria}</p>
                </div>
                <button
                  className="text-sm text-primary-700 hover:text-primary-800 mr-2"
                  onClick={() => {
                    setEditingId(t.id);
                    setForm({
                      nome: t.nome,
                      categoria: t.categoria,
                      sigla: t.sigla ?? '',
                      escudoUrl: t.escudoUrl ?? '',
                    });
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
            ))}
          {times.length === 0 && <p className="p-4 text-sm text-gray-600">Nenhum time.</p>}
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
