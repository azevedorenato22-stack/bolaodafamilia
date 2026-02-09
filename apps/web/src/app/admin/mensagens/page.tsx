'use client';

import { useState, useEffect } from 'react';
import { useProtectedPage } from '@/app/providers';
import {
    listarMensagens,
    salvarMensagem,
    removerMensagem,
} from '@/services/mensagem.service';

export default function AdminMensagensPage() {
    useProtectedPage({ roles: ['ADMIN'] });
    const [mensagens, setMensagens] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        titulo: '',
        conteudo: '',
        tipo: 'INFO',
        ativo: true,
    });

    const carregar = async () => {
        setLoading(true);
        try {
            const data = await listarMensagens();
            setMensagens(data);
        } catch (err) {
            setError('Falha ao carregar mensagens.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregar();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await salvarMensagem(form);
            setForm({ titulo: '', conteudo: '', tipo: 'INFO', ativo: true });
            await carregar();
        } catch (err) {
            setError('Falha ao salvar mensagem.');
        } finally {
            setLoading(false);
        }
    };

    const handleExcluir = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await removerMensagem(id);
            await carregar();
        } catch (err) {
            alert('Falha ao excluir.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Mensagens do Dia</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold">Nova Mensagem</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Título</label>
                            <input
                                className="w-full rounded-md border p-2"
                                value={form.titulo}
                                onChange={e => setForm({ ...form, titulo: e.target.value })}
                                placeholder="Ex: Aviso Importante"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
                            <textarea
                                className="w-full rounded-md border p-2"
                                value={form.conteudo}
                                onChange={e => setForm({ ...form, conteudo: e.target.value })}
                                required
                                rows={3}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                <select
                                    className="w-full rounded-md border p-2"
                                    value={form.tipo}
                                    onChange={e => setForm({ ...form, tipo: e.target.value })}
                                >
                                    <option value="INFO">Info</option>
                                    <option value="ALERTA">Alerta</option>
                                    <option value="SUCESSO">Sucesso</option>
                                </select>
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.ativo}
                                        onChange={e => setForm({ ...form, ativo: e.target.checked })}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Ativo</span>
                                </label>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar Mensagem'}
                        </button>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </form>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Histórico de Mensagens</h2>
                    {mensagens.length === 0 && <p className="text-gray-500">Nenhuma mensagem cadastrada.</p>}
                    {mensagens.map(msg => (
                        <div key={msg.id} className="rounded-lg border bg-white p-4 shadow-sm relative">
                            <div className="flex justify-between">
                                <h3 className="font-semibold text-gray-900">{msg.titulo || 'Sem título'}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${msg.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {msg.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{msg.conteudo}</p>
                            <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                                <span>{new Date(msg.createdAt).toLocaleString('pt-BR')}</span>
                                <button
                                    onClick={() => handleExcluir(msg.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
