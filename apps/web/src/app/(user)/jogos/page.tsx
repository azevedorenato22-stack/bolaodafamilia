'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../providers';
import { listarJogos, salvarPalpite, listarMeusPalpites } from '../../../services/jogos.service';
import { listarMeusBoloes } from '../../../services/boloes.service';
import { listarRodadas } from '../../../services/rodadas.service';
import { GameCard } from './game-card';
import Image from 'next/image';

function JogosContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const bolaoIdParam = searchParams.get('bolaoId');

    const [boloes, setBoloes] = useState<any[]>([]);
    const [selectedBolaoId, setSelectedBolaoId] = useState<string | null>(bolaoIdParam);

    const [rodadas, setRodadas] = useState<any[]>([]);
    const [jogos, setJogos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filtros
    const [rodadaId, setRodadaId] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('PALPITES'); // Default: Abertos
    const [somenteHoje, setSomenteHoje] = useState(false);
    const [dataFilter, setDataFilter] = useState<string>('');
    const [filtroRealizar, setFiltroRealizar] = useState(false); // Novo filtro "A Realizar"

    // 1. Carregar Bolões
    useEffect(() => {
        listarMeusBoloes().then(data => setBoloes(data || []));
    }, []);

    // 2. Carregar Rodadas quando Bolão muda
    useEffect(() => {
        if (selectedBolaoId) {
            setRodadaId(''); // Reseta rodada
            listarRodadas(true, selectedBolaoId).then(data => setRodadas(data || []));
        } else {
            setRodadas([]);
            setRodadaId('');
        }
    }, [selectedBolaoId]);

    // 3. Carregar Jogos
    useEffect(() => {
        if (selectedBolaoId) {
            carregarJogos();
        } else {
            setJogos([]);
        }
    }, [selectedBolaoId, rodadaId, statusFilter, somenteHoje, dataFilter, filtroRealizar]);

    async function carregarJogos() {
        if (!selectedBolaoId) return;
        setLoading(true);
        try {
            const params: any = { bolaoId: selectedBolaoId };

            if (rodadaId) params.rodadaId = rodadaId;

            // Lógica de Status/Período
            if (filtroRealizar) {
                params.periodo = 'FUTURO'; // API trata como PALPITES + FECHADO
            } else {
                if (statusFilter && statusFilter !== 'TODOS') params.status = statusFilter;
                if (somenteHoje) {
                    params.periodo = 'HOJE';
                } else if (dataFilter) {
                    params.data = dataFilter;
                }
            }

            const [listaJogos, meusPalpites] = await Promise.all([
                listarJogos(params),
                listarMeusPalpites(selectedBolaoId).catch(() => [])
            ]);

            const jogosComPalpites = (listaJogos || []).map((j: any) => ({
                ...j,
                palpite: (meusPalpites || []).find((p: any) => p.jogoId === j.id) || null
            }));

            setJogos(jogosComPalpites);
        } catch (error) {
            console.error('Erro ao listar jogos', error);
        } finally {
            setLoading(false);
        }
    }

    const limparFiltros = () => {
        setRodadaId('');
        setStatusFilter('PALPITES');
        setSomenteHoje(false);
        setDataFilter('');
        setFiltroRealizar(false);
    };

    // Se não tem bolão selecionado e não tem lista, loading ou vazio
    if (!user) return null;

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
            {/* Filtros Compactos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-3 flex flex-col gap-4">

                    {/* Linha 1: Selects com Labels */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full">
                        <div className="w-full sm:w-auto min-w-[200px] flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bolão</label>
                            <select
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                value={selectedBolaoId || ''}
                                onChange={e => setSelectedBolaoId(e.target.value)}
                            >
                                <option value="" disabled>Selecione um Bolão...</option>
                                {boloes.map(b => (
                                    <option key={b.id} value={b.id}>{b.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full sm:w-auto min-w-[200px] flex-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rodada</label>
                            <select
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:opacity-50 disabled:bg-gray-100"
                                value={rodadaId}
                                onChange={e => setRodadaId(e.target.value)}
                                disabled={!selectedBolaoId}
                            >
                                <option value="">Todas as Rodadas</option>
                                {rodadas.map(r => (
                                    <option key={r.id} value={r.id}>{r.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="h-[1px] bg-slate-100 w-full" />

                    {/* Linha 2: Filtros de Status, Data e Ações */}
                    <div className="flex flex-wrap items-center justify-between gap-3">

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Botão A Realizar */}
                            <button
                                onClick={() => {
                                    setFiltroRealizar(!filtroRealizar);
                                    if (!filtroRealizar) {
                                        setSomenteHoje(false);
                                        setDataFilter('');
                                        setStatusFilter('');
                                    }
                                }}
                                className={`px-3 h-9 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filtroRealizar
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                ⏳ A Realizar
                            </button>

                            <div className="h-6 w-[1px] bg-gray-200 mx-1 hidden sm:block" />

                            {/* Toggle Hoje */}
                            <button
                                onClick={() => {
                                    const novo = !somenteHoje;
                                    setSomenteHoje(novo);
                                    if (novo) {
                                        setDataFilter('');
                                        setFiltroRealizar(false);
                                        setStatusFilter('');
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold whitespace-nowrap transition-all ${somenteHoje
                                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/30 border border-blue-200'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                📅 Hoje
                            </button>

                            {/* Status Pills */}
                            {!filtroRealizar && ['PALPITES', 'FECHADO', 'ENCERRADO', 'TODOS'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => {
                                        setStatusFilter(st);
                                        setFiltroRealizar(false);
                                    }}
                                    className={`px-3 h-9 rounded-full text-xs font-bold whitespace-nowrap transition-all ${statusFilter === st
                                        ? 'bg-slate-800 text-white shadow-md shadow-slate-500/20'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    {st === 'PALPITES' ? 'Abertos' :
                                        st === 'FECHADO' ? 'Fechados' :
                                            st === 'ENCERRADO' ? 'Encerrados' : 'Todos'}
                                </button>
                            ))}
                        </div>

                        {/* Ações Direita (Data + Limpar) */}
                        <div className="flex items-center gap-2 ml-auto">
                            {!somenteHoje && !filtroRealizar && (
                                <input
                                    type="date"
                                    className="h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={dataFilter}
                                    onChange={e => {
                                        setDataFilter(e.target.value);
                                        if (e.target.value) {
                                            setSomenteHoje(false);
                                            setFiltroRealizar(false);
                                        }
                                    }}
                                />
                            )}

                            <button
                                onClick={limparFiltros}
                                className="px-3 h-9 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Limpar Filtros"
                            >
                                🗑️ Limpar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Jogos */}
            {
                selectedBolaoId && (
                    <div className="space-y-4 animate-fade-in-up">
                        {jogos.length > 0 ? (
                            jogos.map(jogo => (
                                <GameCard
                                    key={jogo.id}
                                    jogo={jogo}
                                    onPalpiteSalvo={() => {
                                        carregarJogos();
                                    }}
                                />
                            ))
                        ) : (
                            !loading && (
                                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                                    <p className="text-gray-400 font-medium">Nenhum jogo encontrado com os filtros selecionados.</p>
                                    <button
                                        onClick={() => {
                                            setRodadaId('');
                                            setStatusFilter('TODOS');
                                            setSomenteHoje(false);
                                        }}
                                        className="mt-2 text-primary-600 text-sm font-bold hover:underline"
                                    >
                                        Limpar Filtros
                                    </button>
                                </div>
                            )
                        )}
                        {loading && (
                            <div className="flex justify-center p-8">
                                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}

export default function JogosPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center flex-col items-center h-[50vh] gap-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-slate-400 text-sm font-bold animate-pulse">Carregando Jogos...</span>
            </div>
        }>
            <JogosContent />
        </Suspense>
    );
}
