'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../../providers';
import { atualizarRodada, criarRodada, excluirRodada, listarRodadas } from '../../../services/rodadas.service';
import { ConfirmModal } from '../../../components/confirm-modal';

export default function AdminRodadasPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [rodadas, setRodadas] = useState<any[]>([]);
  const [form, setForm] = useState({ nome: '', numeroOrdem: '', descricao: '', ativo: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const load = async () => {
    try {
      // Carrega ADMIN (tudo). Backend findAll sem params retorna tudo?
      // Sim, se não passar ativo, retorna tudo.
      const r = await listarRodadas();
      setRodadas(r);
    } catch {
      setErro('Falha ao carregar rodadas.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await atualizarRodada(editingId, {
          nome: form.nome,
          numeroOrdem: form.numeroOrdem ? Number(form.numeroOrdem) : undefined,
          descricao: form.descricao,
          ativo: form.ativo,
        });
      } else {
        await criarRodada({
          nome: form.nome,
          numeroOrdem: form.numeroOrdem ? Number(form.numeroOrdem) : undefined,
          descricao: form.descricao,
          ativo: form.ativo,
        });
      }
      setForm({ nome: '', numeroOrdem: '', descricao: '', ativo: true });
      setEditingId(null);
      await load();
    } catch {
      setErro('Erro ao salvar rodada.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Rodadas</h1>
        <p className="text-sm text-gray-600">Cadastrar e editar rodadas.</p>
      </div>
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
            <label className="text-sm font-medium">Número de ordem</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.numeroOrdem}
              onChange={e => setForm({ ...form, numeroOrdem: e.target.value })}
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
            id="ativo"
            checked={form.ativo}
            onChange={e => setForm({ ...form, ativo: e.target.checked })}
          />
          <label htmlFor="ativo" className="text-sm font-medium">Ativa</label>
        </div>
        <button
          type="submit"
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700"
        >
          {editingId ? 'Atualizar rodada' : 'Criar rodada'}
        </button>
        {editingId && (
          <button
            type="button"
            className="ml-2 text-sm text-gray-600 underline"
            onClick={() => {
              setEditingId(null);
              setForm({ nome: '', numeroOrdem: '', descricao: '', ativo: true });
            }}
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
                <p className="text-sm text-gray-600">
                  Ordem: {r.numeroOrdem ?? '-'} • Jogos: {r.totalJogos ?? 0}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  className="text-primary-700 hover:text-primary-800"
                  onClick={() => {
                    setEditingId(r.id);
                    setForm({
                      nome: r.nome,
                      numeroOrdem: r.numeroOrdem ?? '',
                      descricao: r.descricao ?? '',
                      ativo: r.ativo ?? true,
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
