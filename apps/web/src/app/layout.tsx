import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './providers';
import MensagemModal from '../components/mensagem-modal';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bolão do Chuveiro Ligado',
  description: 'Sistema de bolões esportivos para apostas entre amigos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <AuthProvider>
          {children}
          <MensagemModal />
        </AuthProvider>
      </body>
    </html>
  );
}
