'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { mensagensAtivas } from '../services/mensagem.service';
import { useAuth } from './providers';

export default function Home() {
  const [mensagem, setMensagem] = useState<any | null>(null);
  const [allMensagens, setAllMensagens] = useState<any[]>([]);
  const { closeMensagemPopup } = useAuth();

  useEffect(() => {
    mensagensAtivas()
      .then(msgs => {
        const msgsAtivas = msgs || [];
        setAllMensagens(msgsAtivas);
        const especiais = ['pato', 'lider', 'destaque'];

        // Tenta achar a mais recente que NÃO é especial
        const msg = msgsAtivas.find((m: any) => !especiais.includes(m.tipo?.toLowerCase()));

        // Se não achou nenhuma "geral", o Mural deve ficar vazio para não duplicar os cards abaixo
        setMensagem(msg || null);
      })
      .catch(() => {
        setMensagem((null));
        setAllMensagens([]);
      });
    closeMensagemPopup();
  }, [closeMensagemPopup]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Decorativo - Blobs de Luz */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gray-400/20 blur-[120px] rounded-full animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-400/20 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 md:p-8">
        <div className="text-center max-w-4xl w-full animate-fade-in-up">
          {/* Logo animada */}
          <div className="mb-6 inline-block relative">
            <div className="absolute inset-0 bg-gray-500/20 blur-2xl rounded-full" />
            <Image
              src="/assets/icon-chuveiro-cam.jpg"
              width={100}
              height={100}
              alt="Bolão do Chuveiro Ligado"
              className="relative mx-auto animate-float drop-shadow-2xl"
            />
          </div>

          {/* Título com Gradiente Premium - Fonte diminuída no Mobile */}
          <h1 className="text-2xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-premium-gradient drop-shadow-sm">
              Bolão do Chuveiro Ligado
            </span>
          </h1>

          {/* Mensagem do Dia (Geral) */}
          {mensagem && (
            <div className="glass-card rounded-2xl p-5 mb-10 text-left max-w-md mx-auto border-l-4 border-l-amber-400">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                  {mensagem.titulo || 'Mural do Admin'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 leading-snug break-words">{mensagem.conteudo}</p>
            </div>
          )}

          {/* Botões Premium - Gap reduzido */}
          <div className="flex flex-col sm:flex-row gap-2 justify-center mb-16">
            <Link
              href="/login"
              className="group relative px-8 py-3 bg-gradient-to-r from-gray-800 to-black text-white font-bold rounded-2xl shadow-lg shadow-gray-500/30 hover:shadow-gray-600/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              Entrar no Sistema
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 bg-white/80 backdrop-blur-sm text-gray-900 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50/50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Criar Conta Grátis
            </Link>
          </div>

          {/* Funcionalidades em Cards Glassmorphism - Textos Dinâmicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: '/assets/icon-pato.png',
                title: 'Pato',
                // Busca mensagem do tipo 'pato' ou usa fallback
                desc: allMensagens.find((m: any) => m.tipo?.toLowerCase() === 'pato')?.conteudo || 'Registre seus palpites até 15 minutos antes de cada jogo.',
                delay: '0.1s'
              },
              {
                icon: '/assets/icon-podium.png',
                title: 'Líder',
                desc: allMensagens.find((m: any) => m.tipo?.toLowerCase() === 'lider')?.conteudo || 'Acompanhe sua posição com ranking automático e desempates.',
                delay: '0.2s'
              },
              {
                icon: '/assets/icon-jornal.png',
                title: 'Destaque do dia',
                desc: allMensagens.find((m: any) => m.tipo?.toLowerCase() === 'destaque')?.conteudo || 'Aposte no campeão do torneio e ganhe pontos extras exclusivos.',
                delay: '0.3s'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{ animationDelay: feature.delay }}
                className="glass-card p-6 rounded-3xl hover:bg-white hover:-translate-y-2 transition-all duration-300 border-white/50 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-gradient-to-br from-gray-50 to-slate-100 shadow-inner">
                  <Image src={feature.icon} width={40} height={40} alt={feature.title} className="animate-float" style={{ animationDuration: '4s' }} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium break-words">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Minimalista */}
        <footer className="mt-20 text-center">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-slate-300 to-transparent mx-auto mb-6" />
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            Desenvolvido com <span className="text-red-400 animate-pulse">❤️</span> para os amigos
          </p>
        </footer>
      </main>
    </div>
  );
}
