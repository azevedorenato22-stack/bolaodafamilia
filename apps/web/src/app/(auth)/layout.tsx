'use client';

import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-3xl">⚽</div>
          <h1 className="text-2xl font-semibold text-primary-900">Bolão do Chuveiro Ligado</h1>
          <p className="text-sm text-gray-600">
            Acesse sua conta para palpitar e acompanhar rankings
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          {children}
        </div>
        <Link href="/" className="text-center text-sm text-primary-700 hover:underline block">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
