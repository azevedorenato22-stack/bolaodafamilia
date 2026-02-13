'use client';

import { useEffect, useState } from 'react';
import { extratoUsuario } from '../services/ranking.service';

type Props = {
  bolaoId: string;
  usuarioId: string | null;
  filters?: {
    rodadaId?: string;
    status?: string;
    data?: string;
  };
  onClose: () => void;
};

export function ExtratoModal({ bolaoId, usuarioId, filters, onClose }: Props) {
  const [dados, setDados] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!usuarioId) return;
    setLoading(true);
    extratoUsuario(bolaoId, usuarioId, filters)
      .then(setDados)
      .catch(() => setErro('Falha ao carregar extrato.'))
      .finally(() => setLoading(false));
  }, [bolaoId, usuarioId, filters]);

  const total = dados ? (
    (dados.palpitesJogos?.reduce((acc: number, p: any) => acc + (p.pontuacao || 0), 0) || 0) +
    (dados.palpitesCampeao?.reduce((acc: number, p: any) => acc + (p.pontuacao || 0), 0) || 0)
  ) : 0;

  if (!usuarioId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-gray-900">Extrato do Usuário</h3>
            {dados && (
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xl font-black shadow-sm tracking-tight border border-green-200">
                Total: {total} pts
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-sm font-bold text-gray-400 hover:text-gray-600 bg-gray-100 px-3 py-1 rounded-lg transition-colors">
            FECHAR
          </button>
        </div>
        {loading && <p className="text-sm text-gray-600">Carregando...</p>}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {dados && (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div>
              <p className="text-xs uppercase text-gray-500">Palpites de jogos</p>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {dados.palpitesJogos.map((p: any) => {
                  const getNomeVencedor = (tipo: string) => tipo === 'CASA' ? p.jogo.timeCasa.nome : tipo === 'FORA' ? p.jogo.timeFora.nome : tipo;

                  return (
                    <div key={p.id} className="p-3 text-sm flex items-start justify-between bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col gap-1 pr-2">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">
                          {p.jogo.rodada?.nome}
                        </span>
                        <p className="font-bold text-slate-800 text-base mb-1">
                          {p.jogo.timeCasa.nome} <span className="text-slate-300 font-light">x</span> {p.jogo.timeFora.nome}
                        </p>

                        <div className="flex flex-col gap-1 text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium text-xs uppercase tracking-wide w-16">Palpite:</span>
                            <span className="font-bold text-slate-700">
                              {p.golsCasa} <span className="text-slate-300 mx-0.5">x</span> {p.golsFora}
                            </span>
                            {p.jogo.mataMata && p.vencedorPenaltis && (
                              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase">
                                Pên: {getNomeVencedor(p.vencedorPenaltis)}
                              </span>
                            )}
                          </div>

                          {(p.jogo.resultadoCasa !== null && p.jogo.resultadoCasa !== undefined) && (
                            <div className="flex items-center gap-2 border-t border-slate-200 pt-1 mt-0.5">
                              <span className="text-slate-500 font-medium text-xs uppercase tracking-wide w-16">Resultado:</span>
                              <span className="font-black text-slate-900">
                                {p.jogo.resultadoCasa} <span className="text-slate-300 mx-0.5">x</span> {p.jogo.resultadoFora}
                              </span>
                              {p.jogo.mataMata && p.jogo.vencedorPenaltis && (
                                <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 uppercase">
                                  Pên: {getNomeVencedor(p.jogo.vencedorPenaltis)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-white bg-green-500 font-black text-lg px-2 py-1 rounded-lg shadow-sm min-w-[50px] text-center block">
                          +{p.pontuacao}
                        </span>
                        {(p.pontosPenaltis > 0 || p.pontosJogo > 0) && (
                          <div className="text-[10px] text-gray-500 font-medium flex items-center justify-end gap-1 whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded">
                            <span>Jogo: <span className="font-bold text-slate-700">{p.pontosJogo}</span></span>
                            {p.pontosPenaltis > 0 && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-purple-600 font-black">Pên: {p.pontosPenaltis}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {dados.palpitesJogos.length === 0 && (
                  <p className="p-2 text-sm text-gray-600">Nenhum palpite de jogo.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-500">Palpites de campeão</p>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {dados.palpitesCampeao.map((p: any) => (
                  <div key={p.id} className="p-2 text-sm flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{p.campeao.nome}</p>
                      <p className="text-gray-600">Meu palpite: {p.timeEscolhido?.nome}</p>
                      {p.campeao.resultadoFinal && (
                        <p className="text-gray-600">
                          Resultado: {p.campeao.resultadoFinal.nome}
                        </p>
                      )}
                    </div>
                    <span className="text-primary-700 font-semibold">{p.pontuacao}</span>
                  </div>
                ))}
                {dados.palpitesCampeao.length === 0 && (
                  <p className="p-2 text-sm text-gray-600">Nenhum palpite de campeão.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
