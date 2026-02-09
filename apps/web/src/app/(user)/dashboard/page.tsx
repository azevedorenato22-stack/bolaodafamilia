'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../providers';
import { listarMeusBoloes } from '../../../services/boloes.service';
import { mensagemAtual } from '../../../services/mensagem.service';
import { extratoUsuario } from '../../../services/ranking.service';

export default function DashboardPage() {
  const { user } = useAuth();
  const [boloes, setBoloes] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState<any | null>(null);
  const [pontosPorBolao, setPontosPorBolao] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [msg, meusBoloes] = await Promise.all([
          mensagemAtual().catch(() => null),
          listarMeusBoloes().catch(() => []),
        ]);
        setMensagem(msg);
        setBoloes(meusBoloes || []);

        if (user && meusBoloes && meusBoloes.length > 0) {
          const pontosMap: Record<string, number> = {};
          await Promise.all(
            meusBoloes.map(async (b: any) => {
              try {
                const extrato = await extratoUsuario(b.id, user.id);
                pontosMap[b.id] = extrato.resumo?.pontosTotal ?? 0;
              } catch (e) {
                console.error('Erro ao carregar extrato', e);
              }
            })
          );
          setPontosPorBolao(pontosMap);
        }

      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
      } finally {
        setLoading(false);
      }
    }
    if (user) carregar();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando painel...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Mensagem do Dia */}
      {mensagem && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-amber-800 mb-2">
            {mensagem.titulo || 'Recado Importante'}
          </h2>
          <p className="text-amber-900 leading-relaxed whitespace-pre-wrap">
            {mensagem.conteudo}
          </p>
        </div>
      )}

      {/* Meus Bolões */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Image src="/assets/icon-podium.png" width={28} height={28} alt="Bolões" /> Meus Bolões
        </h2>
        {boloes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center bg-white">
            <p className="text-gray-600 mb-4">Você ainda não participa de nenhum bolão.</p>
            <Link
              href="/boloes"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Encontrar Bolões
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boloes.map((bolao) => (
              <div
                key={bolao.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 truncate pr-2" title={bolao.nome}>
                    {bolao.nome}
                  </h3>
                  <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                    {pontosPorBolao[bolao.id] ?? 0} pts
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {bolao.descricao || 'Sem descrição'}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <Link
                    href={`/jogos?bolaoId=${bolao.id}`}
                    className="flex items-center justify-center px-3 py-2 border border-primary-200 text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                  >
                    Palpites
                  </Link>
                  <Link
                    href={`/ranking?bolaoId=${bolao.id}`}
                    className="flex items-center justify-center px-3 py-2 border border-white text-sm font-medium rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Ranking
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Atalhos Rápidos */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/jogos" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center">
            <Image src="/assets/icon-chuveiro.png" width={40} height={40} alt="Jogos" className="mb-2" />
            <span className="font-semibold text-gray-800">Jogos</span>
          </Link>
          <Link href="/ranking" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center">
            <Image src="/assets/icon-podium.png" width={40} height={40} alt="Ranking" className="mb-2" />
            <span className="font-semibold text-gray-800">Ranking</span>
          </Link>
          <Link href="/boloes" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center">
            <Image src="/assets/icon-pato.png" width={40} height={40} alt="Bolões" className="mb-2" />
            <span className="font-semibold text-gray-800">Bolões</span>
          </Link>
          <Link href="/campeoes" className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all text-center">
            <Image src="/assets/icon-jornal.png" width={40} height={40} alt="Campeões" className="mb-2" />
            <span className="font-semibold text-gray-800">Campeões</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
