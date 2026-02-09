'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProtectedPage, useAuth } from '../../providers';
import { listarJogos } from '../../../services/jogos.service';
import {
    criarPalpite,
    atualizarPalpite,
    listarPalpitesDoJogo,
    listarMeusPalpites,
} from '../../../services/palpites.service';
import { listarMeusBoloes } from '../../../services/boloes.service';

export default function JogosPage() {
    const { user } = useProtectedPage({ roles: ['USUARIO'] });
    const [bolaoFiltro, setBolaoFiltro] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');
    const [rodadaFiltro, setRodadaFiltro] = useState('');
    const [dataFiltro, setDataFiltro] = useState('');
    const [futuroFiltro, setFuturoFiltro] = useState(false);
    const [boloes, setBoloes] = useState<any[]>([]);
    const [jogos, setJogos] = useState<any[]>([]);
    const [rodadas, setRodadas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [palpitesPorJogo, setPalpitesPorJogo] = useState<
        Record<string, { loading: boolean; erro?: string | null; dados?: any[] }>
    >({});
    const [palpitesAbertos, setPalpitesAbertos] = useState<string[]>([]);
    const [meusPalpites, setMeusPalpites] = useState<
        Record<
            string,
            {
                id: string;
                golsCasa: number;
                golsFora: number;
                vencedorPenaltis?: 'CASA' | 'FORA' | null;
                pontuacao?: number | null;
            }
        >
    >({});
    const [formPalpite, setFormPalpite] = useState<Record<
        string,
        { golsCasa: number; golsFora: number; vencedorPenaltis?: 'CASA' | 'FORA' }
    >>({});
    const [isSavingPalpite, setIsSavingPalpite] = useState<Record<string, boolean>>({});
    const [feedback, setFeedback] = useState<Record<string, { tipo: 'ok' | 'erro'; msg: string }>>({});

    useEffect(() => {
        setLoading(true);
        listarMeusBoloes()
            .then((b) => {
                const ativos = b ?? [];
                setBoloes(ativos);
                setRodadas([]);
            })
            .catch(() => setErro('Falha ao carregar bolões.'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const carregarDados = async () => {
            if (!bolaoFiltro) {
                setJogos([]);
                setMeusPalpites({});
                setFormPalpite({});
                return;
            }
            setLoading(true);
            setErro(null);
            try {
                const [listaJogos, meus] = await Promise.all([
                    listarJogos({ bolaoId: bolaoFiltro }),
                    listarMeusPalpites(bolaoFiltro),
                ]);
                setJogos(listaJogos);
                const bolao = boloes.find(b => b.id === bolaoFiltro);
                setRodadas(bolao?.rodadas ?? []);
                const meusMap: Record<string, any> = {};
                const formMap: Record<string, any> = {};
                (meus || []).forEach((p: any) => {
                    meusMap[p.jogoId] = {
                        id: p.id,
                        golsCasa: p.golsCasa,
                        golsFora: p.golsFora,
                        vencedorPenaltis: p.vencedorPenaltis,
                        pontuacao: p.pontuacao,
                    };
                    formMap[p.jogoId] = {
                        golsCasa: p.golsCasa,
                        golsFora: p.golsFora,
                        vencedorPenaltis: p.vencedorPenaltis || undefined,
                    };
                });
                setMeusPalpites(meusMap);
                setFormPalpite(formMap);
            } catch {
                setErro('Falha ao carregar jogos/palpites.');
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, [bolaoFiltro, boloes]);

    const handlePalpite = async (jogo: any) => {
        const current = formPalpite[jogo.id] || { golsCasa: 0, golsFora: 0 };
        const existing = meusPalpites[jogo.id];
        setIsSavingPalpite(prev => ({ ...prev, [jogo.id]: true }));
        setFeedback(prev => {
            const next = { ...prev };
            delete next[jogo.id];
            return next;
        });
        try {
            let resposta: any = null;
            if (existing) {
                resposta = await atualizarPalpite(existing.id, {
                    jogoId: jogo.id,
                    golsCasa: current.golsCasa,
                    golsFora: current.golsFora,
                    vencedorPenaltis: current.vencedorPenaltis,
                });
            } else {
                resposta = await criarPalpite({
                    jogoId: jogo.id,
                    golsCasa: current.golsCasa,
                    golsFora: current.golsFora,
                    vencedorPenaltis: current.vencedorPenaltis,
                });
            }
            setMeusPalpites(prev => ({
                ...prev,
                [jogo.id]: {
                    id: existing?.id ?? resposta.id,
                    golsCasa: current.golsCasa,
                    golsFora: current.golsFora,
                    vencedorPenaltis: current.vencedorPenaltis,
                    pontuacao: resposta?.pontuacao ?? existing?.pontuacao,
                },
            }));
            setFeedback(prev => ({
                ...prev,
                [jogo.id]: { tipo: 'ok', msg: 'Palpite salvo com sucesso.' },
            }));
            if (palpitesAbertos.includes(jogo.id)) {
                await carregarPalpitesJogo(jogo.id, true);
            }
        } catch (err) {
            setFeedback(prev => ({
                ...prev,
                [jogo.id]: { tipo: 'erro', msg: 'Não foi possível salvar. Verifique horário ou dados.' },
            }));
        } finally {
            setIsSavingPalpite(prev => ({ ...prev, [jogo.id]: false }));
        }
    };

    const carregarPalpitesJogo = async (jogoId: string, refresh = false) => {
        const current = palpitesPorJogo[jogoId];
        if (current?.loading || (current?.dados && !refresh)) return;
        setPalpitesPorJogo(prev => ({ ...prev, [jogoId]: { loading: true } }));
        try {
            const lista = await listarPalpitesDoJogo(jogoId);
            setPalpitesPorJogo(prev => ({ ...prev, [jogoId]: { loading: false, dados: lista } }));
            const meu = lista.find((p: any) => p.usuarioId === user?.id);
            if (meu) {
                setMeusPalpites(prev => ({
                    ...prev,
                    [jogoId]: {
                        id: meu.id,
                        golsCasa: meu.golsCasa,
                        golsFora: meu.golsFora,
                        vencedorPenaltis: meu.vencedorPenaltis,
                        pontuacao: meu.pontuacao,
                    },
                }));
                setFormPalpite(prev => ({
                    ...prev,
                    [jogoId]: {
                        golsCasa: meu.golsCasa,
                        golsFora: meu.golsFora,
                        vencedorPenaltis: meu.vencedorPenaltis || undefined,
                    },
                }));
            }
        } catch (err) {
            setPalpitesPorJogo(prev => ({ ...prev, [jogoId]: { loading: false, erro: 'Falha ao carregar palpites' } }));
        }
    };

    const hasSelection = !!bolaoFiltro;
    const filtrados = hasSelection
        ? jogos.filter(jogo => {
            const matchBolao = jogo.bolaoId === bolaoFiltro || jogo.bolao?.nome === bolaoFiltro;
            const matchStatus = !statusFiltro || jogo.status === statusFiltro;
            const matchRodada = !rodadaFiltro || jogo.rodadaId === rodadaFiltro;
            const matchData = !dataFiltro || jogo.dataHora.slice(0, 10) === dataFiltro;
            const isFuturo =
                new Date(jogo.dataHora).getTime() > new Date().setHours(23, 59, 59, 999);
            const matchFuturo = !futuroFiltro || isFuturo;
            return matchBolao && matchStatus && matchRodada && matchData && matchFuturo;
        })
        : [];

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Jogos</h1>
                    <p className="text-sm text-gray-600">Escolha um bolão ativo e filtre status</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <select
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        value={bolaoFiltro}
                        onChange={e => {
                            const next = e.target.value;
                            setBolaoFiltro(next);
                            setRodadaFiltro('');
                            setStatusFiltro('');
                            setDataFiltro('');
                            setInfo(next ? `Bolão selecionado.` : null);
                            setPalpitesPorJogo({});
                            setPalpitesAbertos([]);
                            setMeusPalpites({});
                            setFormPalpite({});
                            setFeedback({});
                        }}
                    >
                        <option value="">Selecione um bolão</option>
                        {boloes.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.nome}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {info && <p className="text-sm text-green-700">{info}</p>}
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            {loading && <p className="text-sm text-gray-600">Carregando jogos...</p>}

            {!hasSelection && (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 bg-white">
                    <p className="text-sm text-gray-700 mb-3">
                        Selecione um bolão para ver e registrar palpites.
                    </p>
                    {boloes.length === 0 ? (
                        <p className="text-sm text-gray-600">
                            Você ainda não participa de nenhum bolão.{' '}
                            <Link href="/boloes" className="text-primary-700 underline">
                                Ver bolões disponíveis
                            </Link>
                            .
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {boloes.map(b => (
                                <button
                                    key={b.id}
                                    className="px-4 py-2 rounded-lg border border-primary-200 text-primary-700 text-sm hover:bg-primary-50"
                                    onClick={() => {
                                        setBolaoFiltro(b.id);
                                        setInfo(`Bolão selecionado: ${b.nome}.`);
                                        setPalpitesPorJogo({});
                                        setPalpitesAbertos([]);
                                        setMeusPalpites({});
                                        setFormPalpite({});
                                        setFeedback({});
                                    }}
                                >
                                    Selecionar {b.nome}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {hasSelection && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Rodada</span>
                        <select
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            value={rodadaFiltro}
                            onChange={e => setRodadaFiltro(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {rodadas
                                .filter((r: any) => r.ativo !== false)
                                .map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.nome}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Status</span>
                        <select
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            value={statusFiltro}
                            onChange={e => setStatusFiltro(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="PALPITES">Palpites</option>
                            <option value="EM_ANDAMENTO">Em andamento</option>
                            <option value="ENCERRADO">Encerrados</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Data</span>
                        <input
                            type="date"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            value={dataFiltro}
                            onChange={e => setDataFiltro(e.target.value)}
                        />
                    </div>
                    <button
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        type="button"
                        onClick={() => {
                            const hoje = new Date().toISOString().slice(0, 10);
                            setDataFiltro(hoje);
                        }}
                    >
                        Jogos do Dia
                    </button>
                    <button
                        className={`rounded-lg border px-3 py-2 text-sm ${futuroFiltro
                            ? 'border-primary-200 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-700'
                            }`}
                        type="button"
                        onClick={() => setFuturoFiltro(prev => !prev)}
                    >
                        A Realizar
                    </button>
                    <button
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        type="button"
                        onClick={() => {
                            setRodadaFiltro('');
                            setStatusFiltro('');
                            setDataFiltro('');
                            setFuturoFiltro(false);
                        }}
                    >
                        Limpar filtros
                    </button>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                {filtrados.map(jogo => {
                    const diffMinutes = (new Date(jogo.dataHora).getTime() - Date.now()) / 60000;
                    const bloqueado = jogo.status !== 'PALPITES' || diffMinutes < 15;
                    const statusBadge =
                        jogo.status === 'PALPITES'
                            ? 'bg-green-50 text-green-700'
                            : jogo.status === 'EM_ANDAMENTO'
                                ? 'bg-yellow-50 text-yellow-800'
                                : 'bg-gray-100 text-gray-700';
                    const saved = meusPalpites[jogo.id];
                    const form = formPalpite[jogo.id] || saved || { golsCasa: 0, golsFora: 0 };
                    const aberto = palpitesAbertos.includes(jogo.id);
                    const palpitesState = palpitesPorJogo[jogo.id];

                    const togglePalpites = async () => {
                        if (aberto) {
                            setPalpitesAbertos(prev => prev.filter(id => id !== jogo.id));
                            return;
                        }
                        setPalpitesAbertos(prev => [...prev, jogo.id]);
                        await carregarPalpitesJogo(jogo.id);
                    };

                    return (
                        <div
                            key={jogo.id}
                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-xs uppercase tracking-wide text-gray-500">
                                    {jogo.bolao?.nome || 'Bolão'} • {jogo.rodada?.nome || 'Rodada'}
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge}`}>
                                    {jogo.status}
                                </span>
                            </div>
                            <div className="text-lg font-semibold">
                                {jogo.timeCasa?.nome} x {jogo.timeFora?.nome}
                            </div>
                            {jogo.status === 'ENCERRADO' && (
                                <p className="text-sm font-semibold text-gray-800">
                                    Placar: {jogo.resultadoCasa ?? '-'} x {jogo.resultadoFora ?? '-'}{' '}
                                    {jogo.mataMata &&
                                        jogo.resultadoCasa === jogo.resultadoFora &&
                                        jogo.vencedorPenaltis
                                        ? `(${jogo.vencedorPenaltis === 'CASA' ? 'Casa' : 'Fora'} nos pênaltis)`
                                        : ''}
                                </p>
                            )}
                            <p className="text-sm text-gray-500">
                                {new Date(jogo.dataHora).toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-gray-600">
                                {bloqueado
                                    ? jogo.status === 'PALPITES'
                                        ? `Palpites bloqueados (faltam ${Math.max(0, Math.round(diffMinutes))} min)`
                                        : 'Palpites encerrados'
                                    : `Palpites liberados (faltam ${Math.round(diffMinutes)} min)`}
                            </p>
                            {feedback[jogo.id] && (
                                <p
                                    className={`text-xs ${feedback[jogo.id].tipo === 'ok' ? 'text-green-700' : 'text-red-600'
                                        }`}
                                >
                                    {feedback[jogo.id].msg}
                                </p>
                            )}
                            {jogo.status === 'ENCERRADO' && saved?.pontuacao !== undefined && (
                                <p className="text-xs text-emerald-700 font-semibold">
                                    Sua pontuação: {saved.pontuacao ?? 0}
                                </p>
                            )}
                            {jogo.status === 'PALPITES' && (
                                <form
                                    className="mt-2 grid grid-cols-2 gap-2"
                                    onSubmit={e => {
                                        e.preventDefault();
                                        handlePalpite(jogo);
                                    }}
                                >
                                    <div>
                                        <label className="text-xs text-gray-600">{jogo.timeCasa?.nome || 'Casa'}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full border rounded-lg px-2 py-1 text-sm"
                                            value={form.golsCasa}
                                            onChange={e =>
                                                setFormPalpite({
                                                    ...formPalpite,
                                                    [jogo.id]: { ...form, golsCasa: Number(e.target.value) },
                                                })
                                            }
                                            disabled={bloqueado}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600">{jogo.timeFora?.nome || 'Fora'}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full border rounded-lg px-2 py-1 text-sm"
                                            value={form.golsFora}
                                            onChange={e =>
                                                setFormPalpite({
                                                    ...formPalpite,
                                                    [jogo.id]: { ...form, golsFora: Number(e.target.value) },
                                                })
                                            }
                                            disabled={bloqueado}
                                        />
                                    </div>
                                    {jogo.mataMata && (
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-600">Vencedor nos pênaltis</label>
                                            <select
                                                className="w-full border rounded-lg px-2 py-1 text-sm"
                                                value={form.vencedorPenaltis || ''}
                                                onChange={e =>
                                                    setFormPalpite({
                                                        ...formPalpite,
                                                        [jogo.id]: {
                                                            ...form,
                                                            vencedorPenaltis: e.target.value
                                                                ? (e.target.value as 'CASA' | 'FORA')
                                                                : undefined,
                                                        },
                                                    })
                                                }
                                                disabled={bloqueado}
                                            >
                                                <option value="">Selecione</option>
                                                <option value="CASA">Casa</option>
                                                <option value="FORA">Fora</option>
                                            </select>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                Selecione o vencedor caso o jogo vá para os pênaltis.
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        className="col-span-2 bg-primary-600 text-white rounded-lg px-3 py-2 text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                        disabled={bloqueado || isSavingPalpite[jogo.id]}
                                    >
                                        {isSavingPalpite[jogo.id] ? 'Salvando...' : saved ? 'Atualizar palpite' : 'Salvar palpite'}
                                    </button>
                                </form>
                            )}
                            {jogo.status !== 'PALPITES' && saved && (
                                <p className="text-xs text-gray-700">
                                    Seu palpite: {saved.golsCasa}x{saved.golsFora}{' '}
                                    {jogo.mataMata && saved.vencedorPenaltis
                                        ? `(${saved.vencedorPenaltis === 'CASA' ? 'Casa' : 'Fora'} nos pênaltis)`
                                        : ''}
                                </p>
                            )}

                            <button
                                type="button"
                                className="text-sm text-primary-700 hover:text-primary-800 mt-1"
                                onClick={togglePalpites}
                            >
                                {aberto ? 'Esconder palpites' : 'Ver palpites'}
                            </button>
                            {aberto && (
                                <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
                                    {palpitesState?.loading && <p className="text-gray-600">Carregando palpites...</p>}
                                    {palpitesState?.erro && <p className="text-red-600">{palpitesState.erro}</p>}
                                    {!palpitesState?.loading && !palpitesState?.dados && (
                                        <p className="text-gray-600">Carregando palpites...</p>
                                    )}
                                    {palpitesState?.dados && palpitesState.dados.length === 0 && (
                                        <p className="text-gray-600">Nenhum palpite disponível.</p>
                                    )}
                                    {palpitesState?.dados && palpitesState.dados.length > 0 && (
                                        <div className="space-y-1">
                                            {jogo.status === 'PALPITES' && (
                                                <p className="text-xs text-gray-600">
                                                    Outros palpites serão exibidos após o início do jogo.
                                                </p>
                                            )}
                                            {palpitesState.dados.map((p: any) => (
                                                <div key={p.id} className="flex items-center justify-between rounded-md bg-white px-2 py-1">
                                                    <span className="font-medium text-gray-800 text-sm">{p.usuario?.nome || 'Usuário'}</span>
                                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                                        <span>
                                                            {p.golsCasa}x{p.golsFora}
                                                            {jogo.mataMata && p.vencedorPenaltis
                                                                ? ` (${p.vencedorPenaltis === 'CASA' ? 'Casa' : 'Fora'} nos pênaltis)`
                                                                : ''}
                                                        </span>
                                                        {typeof p.pontuacao === 'number' && jogo.status === 'ENCERRADO' && (
                                                            <span className="text-xs text-emerald-700 font-semibold">
                                                                {p.pontuacao} pts
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filtrados.length === 0 && !loading && (
                    <p className="text-sm text-gray-600">Nenhum jogo para os filtros selecionados.</p>
                )}
            </div>
        </div>
    );
}
