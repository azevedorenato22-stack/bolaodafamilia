'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../providers';
import { listarMeusBoloes } from '../../../services/boloes.service';
import { mensagensAtivas } from '../../../services/mensagem.service';
import { extratoUsuario } from '../../../services/ranking.service';

export default function DashboardPage() {
  const { user } = useAuth();
  const [boloes, setBoloes] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);
  // Estado agora guarda objeto com pontos e posicao
  const [pontosPorBolao, setPontosPorBolao] = useState<Record<string, { pontos: number, posicao: number | string }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const [msgs, meusBoloes] = await Promise.all([
          mensagensAtivas().catch(() => []),
          listarMeusBoloes().catch(() => []),
        ]);
        setMensagens(msgs || []);
        setBoloes(meusBoloes || []);

        if (user && meusBoloes && meusBoloes.length > 0) {
          const dadosMap: Record<string, { pontos: number, posicao: number | string }> = {};
          await Promise.all(
            meusBoloes.map(async (b: any) => {
              try {
                const extrato = await extratoUsuario(b.id, user.id);
                // Backend agora retorna extrato.posicao
                dadosMap[b.id] = {
                  pontos: extrato.resumo?.pontosTotal ?? 0,
                  posicao: extrato.posicao ?? '-'
                };
              } catch (e) {
                console.error('Erro ao carregar extrato', e);
              }
            })
          );
          setPontosPorBolao(dadosMap);
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-medium">Carregando painel...</p>
      </div>
    );
  }

  // Lógica de Filtro - Pega apenas o PRIMEIRO (mais recente) de cada tipo para evitar duplicação visual
  const lider = mensagens.find((m: any) => m.tipo?.toLowerCase() === 'lider');
  const destaque = mensagens.find((m: any) => m.tipo?.toLowerCase() === 'destaque');
  const pato = mensagens.find((m: any) => m.tipo?.toLowerCase() === 'pato');

  // Gerais não podem conter os tipos especiais
  const especiais = ['lider', 'destaque', 'pato'];
  const gerais = mensagens.filter((m: any) => !especiais.includes(m.tipo?.toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-10 animate-fade-in">

      {/* 1. Recados Gerais */}
      {gerais.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">📢</span> Mural de Avisos
          </h2>
          {gerais.map(msg => (
            <div key={msg.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-6xl">📢</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">
                {msg.titulo || 'Aviso Importante'}
              </h3>
              <div className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-wrap relative z-10 font-medium">
                {msg.conteudo}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Escolha do Bolão (Abaixo de mensagens, antes de destaques) */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-900">
            🏆
          </div>
          Escolha seu Bolão
        </h2>

        {boloes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center bg-slate-50">
            <p className="text-slate-500 mb-6 font-medium">Você ainda não participa de nenhum bolão.</p>
            <Link
              href="/boloes"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-black shadow-lg shadow-gray-500/20 transition-all hover:-translate-y-1"
            >
              Encontrar Bolões Disponíveis
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boloes.map((bolao) => (
              <Link
                key={bolao.id}
                href={`/jogos?bolaoId=${bolao.id}`}
                className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-gray-400 transition-all hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <Image src="/assets/icon-chuveiro.png" width={80} height={80} alt="Background" />
                </div>

                <div className="relative z-10">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                      {pontosPorBolao[bolao.id]?.pontos ?? 0} pts
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold border border-yellow-200">
                      #{pontosPorBolao[bolao.id]?.posicao ?? '-'}º lugar
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-black transition-colors line-clamp-1" title={bolao.nome}>
                    {bolao.nome}
                  </h3>
                  <div className="flex items-center text-sm text-slate-500 font-medium">
                    <span>Clique para ver os jogos</span>
                    <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Botão Voltar ao Mural (Visível apenas se houver scroll ou conteúdo longo) */}
        {boloes.length > 3 && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-sm font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 transition-colors"
            >
              ↑ Voltar ao Mural
            </button>
          </div>
        )}
      </div>

      {/* 3. Blocos de Destaque (Pato, Líder, Destaque) */}
      {(lider || destaque || pato) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="text-2xl">🔥</span> Destaques da Rodada
          </h2>
          <div className="grid gap-6 md:grid-cols-3">

            {/* PATO (Vermelho) */}
            {pato && (
              <div className="rounded-3xl bg-white border border-rose-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-8 drop-shadow-md transition-transform group-hover:rotate-12">
                    <Image src="/assets/icon-pato.png" width={64} height={64} alt="Pato" className="object-contain" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-2">Pato da Rodada</h3>
                  <p className="font-bold text-slate-800 text-lg leading-tight break-all">
                    {pato.conteudo}
                  </p>
                </div>
              </div>
            )}

            {/* LÍDER (Amarelo) */}
            {lider && (
              <div className="rounded-3xl bg-white border border-amber-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-8 drop-shadow-md transition-transform group-hover:-rotate-12">
                    <Image src="/assets/icon-podium.png" width={64} height={64} alt="Líder" className="object-contain" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2">Líder do Ranking</h3>
                  <p className="font-bold text-slate-800 text-lg leading-tight break-all">
                    {lider.conteudo}
                  </p>
                </div>
              </div>
            )}

            {/* DESTAQUE (Verde) */}
            {destaque && (
              <div className="rounded-3xl bg-white border border-emerald-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-8 drop-shadow-md transition-transform group-hover:scale-110">
                    <Image src="/assets/icon-jornal.png" width={64} height={64} alt="Destaque" className="object-contain" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">Destaque do Dia</h3>
                  <p className="font-bold text-slate-800 text-lg leading-tight break-all">
                    {destaque.conteudo}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
