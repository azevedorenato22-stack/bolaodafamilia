'use client';

import { useEffect, useState } from 'react';
import { listarPalpitesDoJogo } from '../services/palpites.service';

type Props = {
  jogoId: string | null;
  status?: string;
  onClose: () => void;
};

export function PalpiteListModal({ jogoId, status, onClose }: Props) {
  const [palpites, setPalpites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!jogoId) return;
    setLoading(true);
    listarPalpitesDoJogo(jogoId)
      .then(setPalpites)
      .catch(() => setErro('Falha ao carregar palpites.'))
      .finally(() => setLoading(false));
  }, [jogoId]);

  if (!jogoId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Palpites</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Fechar
          </button>
        </div>
        {loading && <p className="text-sm text-gray-600">Carregando...</p>}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {palpites.map(p => (
            <div
              key={p.id}
              className="rounded-lg border border-gray-100 p-2 flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-semibold">{p.usuario?.nome || 'Eu'}</p>
                <p className="text-gray-600">
                  {p.golsCasa} x {p.golsFora}
                  {p.vencedorPenaltis ? ` (${p.vencedorPenaltis} nos pênaltis)` : ''}
                </p>
              </div>
              <span className="text-primary-700 font-semibold">{p.pontuacao ?? '-'}</span>
            </div>
          ))}
          {!loading && palpites.length === 0 && (
            <p className="text-sm text-gray-600">
              {status === 'PALPITES'
                ? 'Palpites de outros usuários ficarão visíveis após o início do jogo.'
                : 'Nenhum palpite disponível.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
