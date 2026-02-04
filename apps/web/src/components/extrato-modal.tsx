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
    extratoUsuario(bolaoId, usuarioId)
      .then(setDados)
      .catch(() => setErro('Falha ao carregar extrato.'))
      .finally(() => setLoading(false));
  }, [bolaoId, usuarioId, filters]);

  if (!usuarioId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Extrato do usuário</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Fechar
          </button>
        </div>
        {loading && <p className="text-sm text-gray-600">Carregando...</p>}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {dados && (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div>
              <p className="text-xs uppercase text-gray-500">Palpites de jogos</p>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {dados.palpitesJogos.map((p: any) => (
                  <div key={p.id} className="p-2 text-sm flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                        {p.jogo.rodada?.nome}
                      </span>
                      <p className="font-semibold">
                        {p.jogo.timeCasa.nome} x {p.jogo.timeFora.nome}
                      </p>
                      <p className="text-gray-600">
                        Palpite {p.golsCasa}x{p.golsFora} • Resultado{' '}
                        {p.jogo.resultadoCasa}x{p.jogo.resultadoFora}
                      </p>
                      {p.jogo.mataMata && (
                        <p className="text-gray-600 text-xs">
                          Pênaltis: palpite {p.vencedorPenaltis || '-'} • resultado{' '}
                          {p.jogo.vencedorPenaltis || '-'}
                        </p>
                      )}
                    </div>
                    <span className="text-primary-700 font-semibold">{p.pontuacao}</span>
                  </div>
                ))}
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
