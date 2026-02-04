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
    descricao: '',
    dataLimite: '',
    pontuacao: 20,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [palpites, setPalpites] = useState<Record<string, any[]>>({});

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
        const primeirosTimes = ativos[0]?.times?.map((bt: any) => bt.time ?? bt) ?? t;
        setTimes(primeirosTimes);
        if (ativos[0]) {
          setBolaoId(ativos[0].id);
          load(ativos[0].id, ativos[0]);
        }
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
          descricao: form.descricao,
          dataLimite: toIsoFromLocalInput(form.dataLimite),
          pontuacao: form.pontuacao,
        });
      } else {
        await criarCampeao({
          bolaoId,
          nome: form.nome,
          descricao: form.descricao,
          dataLimite: toIsoFromLocalInput(form.dataLimite),
          pontuacao: form.pontuacao,
        });
      }
      setForm({ nome: '', descricao: '', dataLimite: '', pontuacao: 20 });
      setEditingId(null);
      await load(bolaoId);
      setSucesso(editingId ? 'Campeão atualizado com sucesso.' : 'Campeão criado com sucesso.');
    } catch {
      setErro('Erro ao salvar campeão.');
    }
  };

  const definirResultado = async (campeaoId: string, timeId: string) => {
    setErro(null);
    setSucesso(null);
    const payloadValue = timeId ? timeId : null;
    setCampeoes(prev =>
      prev.map(c =>
        c.id === campeaoId ? { ...c, resultadoFinalId: payloadValue } : c,
      ),
    );
    try {
      await atualizarCampeao(campeaoId, { resultadoFinalId: payloadValue });
      await load(bolaoId);
      setSucesso('Resultado definido e pontuação recalculada.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao definir resultado.';
      setErro(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const atualizarPalpiteAdmin = async (palpiteId: string, campeaoId: string, timeId: string) => {
    setErro(null);
    setSucesso(null);
    try {
      await atualizarPalpiteCampeaoAdmin(palpiteId, { timeId });
      const palps = await listarPalpitesCampeao(campeaoId);
      setPalpites(prev => ({ ...prev, [campeaoId]: palps }));
      setSucesso('Palpite atualizado.');
    } catch {
      setErro('Erro ao atualizar palpite.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Campeões</h1>
        <p className="text-sm text-gray-600">Gerencie categorias de campeão por bolão.</p>
      </div>
      {sucesso && <p className="text-sm text-green-700">{sucesso}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={bolaoId}
          onChange={async e => {
            setBolaoId(e.target.value);
            const selected = boloes.find(b => b.id === e.target.value);
            setTimes(selected?.times?.map((bt: any) => bt.time ?? bt) ?? []);
            await load(e.target.value, selected);
          }}
        >
          {boloes.map(b => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
      </div>

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
            <label className="text-sm font-medium">Data limite</label>
            <input
              type="datetime-local"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.dataLimite}
              onChange={e => setForm({ ...form, dataLimite: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Pontuação</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.pontuacao}
              onChange={e => setForm({ ...form, pontuacao: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary-700"
        >
          {editingId ? 'Atualizar campeão' : 'Criar campeão'}
        </button>
        {editingId && (
          <button
            type="button"
            className="ml-2 text-sm text-gray-600 underline"
            onClick={() => {
              setEditingId(null);
              setForm({ nome: '', descricao: '', dataLimite: '', pontuacao: 20 });
            }}
          >
            Cancelar edição
          </button>
        )}
      </form>

      <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="p-4 text-sm font-semibold text-gray-700 border-b">Campeões</div>
        <div className="divide-y divide-gray-100">
          {campeoes.map(c => (
            <div key={c.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{c.nome}</p>
                  <p className="text-sm text-gray-600">
                    Limite: {new Date(c.dataLimite).toLocaleString('pt-BR')} • Pontos:{' '}
                    {c.pontuacao ?? c.bolao?.ptsCampeao}
                  </p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    className="text-primary-700 hover:text-primary-800"
                    onClick={() => {
                      setEditingId(c.id);
                      setForm({
                        nome: c.nome,
                        descricao: c.descricao ?? '',
                        dataLimite: formatDateTimeLocal(c.dataLimite),
                        pontuacao: c.pontuacao ?? c.bolao?.ptsCampeao ?? 20,
                      });
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setConfirmId(c.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Definir resultado:</span>
                <select
                  className="border rounded-lg px-2 py-1 text-sm"
                  value={c.resultadoFinalId || ''}
                  onChange={e => definirResultado(c.id, e.target.value)}
                >
                  <option value="">Selecione</option>
                  {times
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                </select>
              </div>
              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-2">Palpites dos usuários</p>
                {palpites[c.id]?.length ? (
                  <div className="space-y-2">
                    {palpites[c.id].map((p: any) => (
                      <div
                        key={p.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-200 rounded-md bg-white px-3 py-2"
                      >
                        <div className="text-sm">
                          <p className="font-semibold text-gray-800">{p.usuario?.nome || 'Usuário'}</p>
                          <p className="text-xs text-gray-500">
                            Pontos: {p.pontuacao ?? 0}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Time escolhido:</span>
                          <select
                            className="border rounded-lg px-2 py-1 text-sm"
                            value={p.timeEscolhidoId || ''}
                            onChange={e => atualizarPalpiteAdmin(p.id, c.id, e.target.value)}
                          >
                            <option value="">Selecione</option>
                            {times.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Nenhum palpite.</p>
                )}
              </div>
            </div>
          ))}
          {campeoes.length === 0 && <p className="p-4 text-sm text-gray-600">Nenhum campeão.</p>}
        </div>
      </div>
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
