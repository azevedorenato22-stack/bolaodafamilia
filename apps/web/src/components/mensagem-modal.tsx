'use client';

import { useAuth } from '../app/providers';

export default function MensagemModal() {
  const { mensagem, showMensagemPopup, closeMensagemPopup } = useAuth();

  if (!mensagem || !showMensagemPopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm uppercase tracking-wide text-primary-700 font-semibold">
            {mensagem.titulo || 'Mensagem do administrador'}
          </div>
          <button
            onClick={closeMensagemPopup}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Fechar
          </button>
        </div>
        <p className="text-sm text-gray-800">{mensagem.conteudo}</p>
      </div>
    </div>
  );
}
