'use client';

import { useEffect, useState } from 'react';
import { useProtectedPage } from '../providers';
import { mensagemAtual, removerMensagem, salvarMensagem } from '../../services/mensagem.service';

export default function AdminPage() {
  useProtectedPage({ roles: ['ADMIN'] });
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState('info');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [msgId, setMsgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    mensagemAtual()
      .then(msg => {
        if (msg) {
          setMsgId(msg.id ?? null);
          setTitulo(msg.titulo ?? '');
          setConteudo(msg.conteudo ?? '');
          setTipo(msg.tipo ?? 'info');
          setDataInicio(msg.dataInicio ? msg.dataInicio.slice(0, 16) : '');
          setDataFim(msg.dataFim ? msg.dataFim.slice(0, 16) : '');
        }
      })
      .catch(() => {
        // ignora se não houver mensagem
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    setErro(null);
    try {
      await salvarMensagem({
        titulo,
        conteudo,
        tipo,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        ativo: true,
      });
      setFeedback('Mensagem publicada com sucesso.');
    } catch {
      setErro('Falha ao publicar mensagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Mensagem do dia</h1>
        <p className="text-sm text-gray-600">
          Cadastre um aviso para exibir a todos os usuários na página inicial.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Título (opcional)</label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
            >
              <option value="info">Info</option>
              <option value="alerta">Alerta</option>
              <option value="aviso">Aviso</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Conteúdo</label>
          <textarea
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm min-h-[120px]"
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Início (opcional)</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Fim (opcional)</label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-5 py-2 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar mensagem'}
          </button>
          <button
            type="button"
            className="ml-2 text-sm text-red-600 hover:text-red-700"
            onClick={async () => {
              setLoading(true);
              setFeedback(null);
              setErro(null);
              try {
                if (msgId) {
                  await removerMensagem(msgId);
                }
                setMsgId(null);
                setTitulo('');
                setConteudo('');
                setDataInicio('');
                setDataFim('');
                setFeedback('Mensagem removida.');
              } catch {
                setErro('Falha ao remover mensagem.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Remover mensagem
          </button>
        </div>
      </form>
      {feedback && <p className="text-sm text-green-700">{feedback}</p>}
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
