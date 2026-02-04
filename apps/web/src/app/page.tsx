'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mensagemAtual } from '../services/mensagem.service';
import { useAuth } from './providers';

export default function Home() {
  const [mensagem, setMensagem] = useState<any | null>(null);
  const { closeMensagemPopup } = useAuth();
  useEffect(() => {
    mensagemAtual().then(setMensagem).catch(() => setMensagem(null));
    closeMensagemPopup();
  }, [closeMensagemPopup]);

  return (
    <>
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-primary-50 to-white">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-6xl">⚽</span>
        </div>

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
          Bolão do Chuveiro Ligado
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Sistema de bolões esportivos para apostas entre amigos.
          Faça seus palpites, acompanhe o ranking e divirta-se!
        </p>

        {mensagem && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs uppercase font-semibold text-amber-800">
              {mensagem.titulo || 'Mensagem do administrador'}
            </p>
            <p className="text-sm text-amber-900">{mensagem.conteudo}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
          >
            Cadastre-se
          </Link>
        </div>

        {/* Funcionalidades */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <span className="text-2xl mb-2 block">🎯</span>
            <h3 className="font-semibold text-gray-900 mb-2">Palpites</h3>
            <p className="text-sm text-gray-600">
              Registre seus palpites até 15 minutos antes de cada jogo
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <span className="text-2xl mb-2 block">🏆</span>
            <h3 className="font-semibold text-gray-900 mb-2">Ranking</h3>
            <p className="text-sm text-gray-600">
              Acompanhe sua posição com ranking automático e desempates
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <span className="text-2xl mb-2 block">👑</span>
            <h3 className="font-semibold text-gray-900 mb-2">Campeão</h3>
            <p className="text-sm text-gray-600">
              Aposte no campeão do torneio e ganhe pontos extras
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-gray-500">
        <p>Desenvolvido com ❤️ para os amigos</p>
      </footer>
    </main>
    </>
  );
}
