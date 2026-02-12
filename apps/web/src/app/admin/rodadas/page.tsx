'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import { atualizarRodada, criarRodada, excluirRodada, listarRodadas } from '../../../services/rodadas.service';
import { listarBoloesAdmin } from '../../../services/boloes.service';
import { ConfirmModal } from '../../../components/confirm-modal';

export default function AdminRodadasPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [rodadas, setRodadas] = useState<any[]>([]);
  const [boloes, setBoloes] = useState<any[]>([]);
  const [form, setForm] = useState<{ nome: string; bolaoIds: string[]; ativo: boolean }>({
    nome: '',
    bolaoIds: [],
    ativo: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const [r, b] = await Promise.all([listarRodadas(), listarBoloesAdmin()]);
      setRodadas(r);
      setBoloes(b);
    } catch {
      setErro('Falha ao carregar dados.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setIsSaving(true);
    const isEditing = Boolean(editingId);
    try {
      const payload = {
        nome: form.nome,
        ativo: form.ativo,
        bolaoIds: form.bolaoIds,
      };

      if (editingId) {
        await atualizarRodada(editingId, payload);
      } else {
        await criarRodada(payload);
      }
      setForm({ nome: '', bolaoIds: [], ativo: true });
      setEditingId(null);
      await load();
      setSucesso(isEditing ? 'Rodada atualizada com sucesso.' : 'Rodada criada com sucesso.');
    } catch {
      setErro('Erro ao salvar rodada.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Rodadas</h1>
        <p className="text-sm text-gray-600">Cadastrar e editar rodadas.</p>
      </div>
      {sucesso && <p className="text-sm text-green-700">{sucesso}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <form onSubmit={submit} className="space-y-3 border border-gray-200 rounded-xl p-4 bg-white">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Nome da Rodada</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              required
              placeholder="Ex: Rodada 1, Quartas de Final..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Vincular a Bolões</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-gray-50">
              {boloes.map(b => (
                <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    checked={form.bolaoIds.includes(b.id)}
                    onChange={e => {
                      const checked = e.target.checked;
                      setForm(prev => ({
                        ...prev,
                        bolaoIds: checked
                          ? [...prev.bolaoIds, b.id]
                          : prev.bolaoIds.filter(id => id !== b.id)
                      }));
                    }}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="truncate" title={b.nome}>{b.nome}</span>
                </label>
              ))}
              {boloes.length === 0 && <span className="text-xs text-gray-500 col-span-3">Nenhum bolão cadastrado.</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={form.ativo}
            onChange={e => setForm({ ...form, ativo: e.target.checked })}
          />
          <label htmlFor="ativo" className="text-sm font-medium">Ativa</label>
        </div>
        <button
          type="submit"
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving}
        >
          {isSaving ? 'Salvando...' : editingId ? 'Atualizar rodada' : 'Criar rodada'}
        </button>
        {editingId && (
          <button
            type="button"
            className="ml-2 text-sm text-gray-600 underline disabled:opacity-50"
            onClick={() => {
              setEditingId(null);
              setForm({ nome: '', bolaoIds: [], ativo: true });
            }}
            disabled={isSaving}
          >
            Cancelar edição
          </button>
        )}
      </form>

      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 text-sm font-semibold text-gray-700 border-b">Rodadas</div>
        <div className="divide-y divide-gray-100">
          {rodadas.map(r => (
            <div key={r.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {r.nome}
                  {!r.ativo && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                      Inativa
                    </span>
                  )}
                </p>

                <div className="mt-1 flex flex-wrap gap-1">
                  {r.boloes && r.boloes.length > 0 ? (
                    r.boloes.map((b: any) => (
                      <span key={b.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {b.nome}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">Sem vínculo</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Jogos: {r.totalJogos ?? 0}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  className="text-primary-700 hover:text-primary-800"
                  onClick={() => {
                    setEditingId(r.id);
                    setForm({
                      nome: r.nome,
                      ativo: r.ativo ?? true,
                      bolaoIds: r.boloes ? r.boloes.map((b: any) => b.id) : [],
                    });
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setConfirmId(r.id)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {rodadas.length === 0 && <p className="p-4 text-sm text-gray-600">Nenhuma rodada.</p>}
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          title="Confirmar exclusão"
          description="Esta ação removerá a rodada."
          onCancel={() => setConfirmId(null)}
          onConfirm={async senha => {
            setConfirmId(null);
            try {
              await excluirRodada(confirmId, senha);
              await load();
            } catch {
              setErro('Não foi possível excluir a rodada.');
            }
          }}
        />
      )}
    </div>
  );
}
