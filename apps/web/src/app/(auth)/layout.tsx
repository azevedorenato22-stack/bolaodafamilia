'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <div className="relative min-h-screen overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-6 bg-slate-50">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gray-400/10 blur-[100px] rounded-full animate-float" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-slate-400/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />

      <div className="relative z-10 w-full max-w-md animate-fade-in-up py-10">
        {/* Card Principal Glassmorphism */}
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-white/40 mb-8">
          <div className="text-center mb-8">
            <div className="relative w-40 h-40 mx-auto mb-6 overflow-visible">
              <Image
                src="/assets/icon-chuveiro-cam.jpg"
                fill
                alt="Bolão Chuveiro"
                className="object-contain object-center drop-shadow-lg"
                priority
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase mt-2">
              Bolão do Chuveiro
            </h1>
            <div className="h-1 w-12 bg-gray-900 mx-auto mt-2 rounded-full" />
          </div>

          {children}
        </div>

        {/* Blocos Informativos (Apenas Login) */}
        {isLogin && (
          <div className="grid gap-4 mb-4">
            {[
              {
                icon: '/assets/icon-pato.png',
                title: 'Pato',
                desc: 'Registre seus palpites até 15 min antes.'
              },
              {
                icon: '/assets/icon-podium.png',
                title: 'Líder',
                desc: 'Acompanhe sua posição no ranking.'
              },
              {
                icon: '/assets/icon-jornal.png',
                title: 'Destaque do dia',
                desc: 'Aposte no campeão e ganhe pontos.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="glass-card p-4 rounded-2xl flex items-center gap-4 bg-white/60 border-white/40">
                <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-gray-100 flex items-center justify-center">
                  <Image src={feature.icon} width={24} height={24} alt={feature.title} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{feature.title}</h3>
                  <p className="text-xs text-slate-600 leading-snug">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Links de Apoio */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-gray-900 transition-colors"
          >
            ← Voltar para o Início
          </Link>
        </div>
      </div>
    </div>
  );
}
