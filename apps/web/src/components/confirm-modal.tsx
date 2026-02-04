'use client';

type Props = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: (senha: string) => void;
  onCancel: () => void;
};

import { useState } from 'react';

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
}: Props) {
  const [senha, setSenha] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Digite sua senha para confirmar</label>
          <input
            type="password"
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(senha)}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
