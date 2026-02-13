import { useState } from 'react';
import Image from 'next/image';
import { salvarPalpite, atualizarPalpite, listarPalpitesDoJogo } from '../../../services/jogos.service';

interface GameCardProps {
    jogo: any;
    onPalpiteSalvo?: () => void;
}

export function GameCard({ jogo, onPalpiteSalvo }: GameCardProps) {
    const palpiteExistente = jogo.palpite;
    const [golsCasa, setGolsCasa] = useState<string>(palpiteExistente?.golsCasa?.toString() ?? '');
    const [golsFora, setGolsFora] = useState<string>(palpiteExistente?.golsFora?.toString() ?? '');
    const [vencedorPenaltis, setVencedorPenaltis] = useState<string | undefined>(palpiteExistente?.vencedorPenaltis ?? undefined);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [showPalpites, setShowPalpites] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Novos estados para palpites da galera
    const [palpitesOutros, setPalpitesOutros] = useState<any[]>([]);
    const [loadingPalpites, setLoadingPalpites] = useState(false);

    const isPalpitesOpen = jogo.status === 'PALPITES';
    const isEncerrado = jogo.status === 'ENCERRADO';
    const showInputs = isPalpitesOpen;

    const carregarPalpitesOutros = async () => {
        setLoadingPalpites(true);
        try {
            const data = await listarPalpitesDoJogo(jogo.id);
            setPalpitesOutros(data || []);
        } catch (e) {
            console.error('Erro ao carregar palpites extras', e);
        } finally {
            setLoadingPalpites(false);
        }
    };

    // Lógica Mata-mata: Obrigatório escolher pênaltis se for mata-mata
    const userSelectedEmpate = golsCasa !== '' && golsFora !== '' && Number(golsCasa) === Number(golsFora);
    const needsPenaltis = jogo.mataMata; // Regra cliente: "Todo jogo mata-mata obrigatório escolher"

    const handleSave = async () => {
        if (golsCasa === '' || golsFora === '') return;

        // Se for mata-mata, EXIGE vencedor penaltis sempre (conforme pedido), OU apenas se empate?
        // Pedido: "Todo jogo com a flag mata-mata tem obrigatoriamente que escolher..."
        if (jogo.mataMata && !vencedorPenaltis) {
            setMsg('Escolha o vencedor (classificado)');
            return;
        }

        setSaving(true);
        setMsg(null);
        try {
            const payload = {
                jogoId: jogo.id,
                golsCasa: Number(golsCasa),
                golsFora: Number(golsFora),
                vencedorPenaltis: jogo.mataMata ? vencedorPenaltis : undefined,
            };

            if (palpiteExistente?.id) {
                await atualizarPalpite(palpiteExistente.id, payload);
            } else {
                await salvarPalpite(payload);
            }

            setMsg('Salvo!');
            setTimeout(() => setMsg(null), 2000);
            setIsEditing(false);
            if (onPalpiteSalvo) onPalpiteSalvo();
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'Erro ao salvar';
            setMsg(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
            {/* Status Badge no canto superior direito */}
            <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold text-white rounded-bl-xl shadow-sm z-10 ${jogo.status === 'PALPITES' ? 'bg-green-500' :
                jogo.status === 'FECHADO' ? 'bg-amber-500' :
                    'bg-slate-500'
                }`}>
                {jogo.status === 'PALPITES' ? 'ABERTO' :
                    jogo.status === 'FECHADO' ? 'FECHADO' :
                        'ENCERRADO'}
            </div>

            <div className="p-4 pt-8">
                {/* Placar e Times */}
                {/* Placar e Times (Novo Layout) */}
                <div className="flex flex-col items-center mb-6">
                    {/* Título: Time A [Res] x [Res] Time B */}
                    <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-black text-slate-800 tracking-tight text-center leading-tight w-full">
                        <span className="uppercase">{jogo.timeCasa.nome}</span>

                        {(isEncerrado || jogo.status === 'FECHADO' || jogo.status === 'AO_VIVO') ? (
                            <div className="flex items-center gap-1 mx-1">
                                <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-900">
                                    {jogo.resultadoCasa ?? 0} <span className="text-slate-400 text-sm">x</span> {jogo.resultadoFora ?? 0}
                                </span>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-sm font-light px-2">x</span>
                        )}

                        <span className="uppercase">{jogo.timeFora.nome}</span>
                    </div>

                    {/* Data e Hora (Abaixo do título) */}
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wide bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {jogo.rodada?.nome}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide bg-slate-50 px-2 py-1 rounded">
                            {new Date(jogo.dataHora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '')} • {new Date(jogo.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Badges (Mata-mata / Pênaltis) - Nova Linha Abaixo */}
                    {(jogo.mataMata || (jogo.vencedorPenaltis && (isEncerrado || jogo.status === 'FECHADO' || jogo.status === 'AO_VIVO'))) && (
                        <div className="flex items-center gap-2 mt-2">
                            {jogo.mataMata && (
                                <span className="text-[9px] font-bold text-white bg-purple-500 px-2 py-1 rounded uppercase tracking-wider">
                                    Mata-Mata
                                </span>
                            )}
                            {jogo.mataMata && jogo.vencedorPenaltis && (isEncerrado || jogo.status === 'FECHADO' || jogo.status === 'AO_VIVO') && (
                                <span className="text-[10px] font-black text-white bg-purple-600 px-2 py-1 rounded-lg uppercase shadow-sm whitespace-nowrap">
                                    Pên: {jogo.vencedorPenaltis === 'CASA' ? 'Casa' : 'Fora'}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Área de Palpite (Inputs ou Resumo) */}
                {showInputs && (
                    <div className="mt-2 p-4 bg-slate-50/80 rounded-xl border border-slate-100/80 backdrop-blur-sm animate-fade-in">

                        {/* Se já tem palpite e não está editando, mostra resumo estilo "Lista" */}
                        {palpiteExistente && !isEditing ? (
                            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="font-mono font-bold text-slate-800 text-lg">
                                        {palpiteExistente.golsCasa} <span className="text-slate-300 text-sm">x</span> {palpiteExistente.golsFora}
                                    </div>
                                    {palpiteExistente.vencedorPenaltis && (
                                        <span className="text-[10px] font-bold text-white bg-purple-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                            PÊN: {palpiteExistente.vencedorPenaltis === 'CASA' ? 'CASA' : 'FORA'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                >
                                    EDITAR
                                </button>
                            </div>
                        ) : (
                            /* Modo Edição (Inputs) */
                            <>
                                <div className="flex items-center justify-center gap-4 mb-4">
                                    <div className="text-center">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter w-full text-center">
                                            {jogo.timeCasa.nome}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-16 h-12 text-center border-2 border-slate-200 rounded-xl font-bold text-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white text-slate-800 shadow-sm"
                                            value={golsCasa}
                                            onChange={(e) => setGolsCasa(e.target.value)}
                                            placeholder="-"
                                        />
                                    </div>
                                    <span className="text-slate-300 font-light text-2xl mt-4">×</span>
                                    <div className="text-center">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter w-full text-center">
                                            {jogo.timeFora.nome}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-16 h-12 text-center border-2 border-slate-200 rounded-xl font-bold text-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-white text-slate-800 shadow-sm"
                                            value={golsFora}
                                            onChange={(e) => setGolsFora(e.target.value)}
                                            placeholder="-"
                                        />
                                    </div>
                                </div>

                                {/* Pênaltis (Se Mata-mata) */}
                                {needsPenaltis && (
                                    <div className="mb-4 animate-fade-in">
                                        <div className="text-center mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                                                Quem vence/classifica?
                                            </span>
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => setVencedorPenaltis('CASA')}
                                                className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${vencedorPenaltis === 'CASA'
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                                                    }`}
                                            >
                                                {jogo.timeCasa.nome}
                                            </button>
                                            <button
                                                onClick={() => setVencedorPenaltis('FORA')}
                                                className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg border transition-all ${vencedorPenaltis === 'FORA'
                                                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                                                    }`}
                                            >
                                                {jogo.timeFora.nome}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {palpiteExistente && (
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-3.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || golsCasa === '' || golsFora === ''}
                                        className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${msg === 'Salvo!' ? 'bg-green-500 text-white shadow-green-500/30' :
                                            saving ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' :
                                                'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {saving ? 'Salvando...' : msg || (palpiteExistente ? 'Atualizar Palpite' : 'Confirmar Palpite')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Botão Ver Palpites e Pontuação (Se Fechado/Encerrado) */}
                {!showInputs && (
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                if (!showPalpites) carregarPalpitesOutros();
                                setShowPalpites(!showPalpites);
                            }}
                            className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100"
                        >
                            {showPalpites ? 'Ocultar Palpites' : 'Ver Palpites e Resultados'}
                            <span className="text-[10px] transform transition-transform duration-300" style={{ transform: showPalpites ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </button>

                        {showPalpites && (
                            <div className="mt-2 text-sm space-y-2 animate-fade-in p-2 bg-slate-50 rounded-xl border border-slate-100">
                                {/* Palpite do Usuário */}
                                {/* Palpite do Usuário */}
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex justify-between items-center">
                                    <div>
                                        {/* Label removida conforme solicitado */}
                                        <div className="font-mono font-bold text-slate-800 text-lg">
                                            {palpiteExistente ? `${palpiteExistente.golsCasa} x ${palpiteExistente.golsFora}` : <span className="text-slate-300">Não palpitou</span>}
                                            {palpiteExistente?.vencedorPenaltis && <span className="text-xs text-purple-600 ml-2 font-bold uppercase">(Pên: {palpiteExistente.vencedorPenaltis})</span>}
                                        </div>
                                    </div>

                                    {/* Pontuação */}
                                    {palpiteExistente?.pontuacao !== undefined && isEncerrado && (
                                        <div className="text-right flex flex-col items-end">
                                            <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-sm font-bold mb-1">
                                                +{palpiteExistente.pontuacao} pts
                                            </span>
                                            <div className="text-[10px] text-slate-500 font-medium flex flex-col items-end leading-tight">
                                                <span>Jogo: {palpiteExistente.pontosJogo} pts</span>
                                                {palpiteExistente.pontosPenaltis > 0 && <span>Pênaltis: {palpiteExistente.pontosPenaltis} pts</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Lista de Palpites da Galera */}
                                <div className="mt-4 border-t border-slate-100 pt-3">
                                    <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Palpites da Galera</h4>
                                    {loadingPalpites ? (
                                        <div className="text-center py-4 text-xs text-slate-400">Carregando...</div>
                                    ) : palpitesOutros.length > 0 ? (
                                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                            {palpitesOutros.map((p) => (
                                                <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                            {p.usuario?.nome?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate" title={p.usuario?.nome}>
                                                            {p.usuario?.nome}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-mono font-bold text-slate-800">
                                                                {p.golsCasa} <span className="text-slate-300 text-xs">x</span> {p.golsFora}
                                                            </span>
                                                            {p.vencedorPenaltis && (
                                                                <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase border border-purple-100">
                                                                    PÊN: {p.vencedorPenaltis === 'CASA' ? 'C' : 'F'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {isEncerrado && p.pontuacao !== undefined && (
                                                            <div className="text-right">
                                                                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.pontuacao > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                    +{p.pontuacao} pts
                                                                </div>
                                                                {(p.pontosPenaltis > 0 || p.pontosJogo > 0) && (
                                                                    <div className="text-[8px] text-slate-400 font-medium mt-0.5 flex justify-end gap-1">
                                                                        <span>{p.pontosJogo}J</span>
                                                                        {p.pontosPenaltis > 0 && <span>+ {p.pontosPenaltis}P</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-xs text-slate-400">Nenhum palpite encontrado.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
