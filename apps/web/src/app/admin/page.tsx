'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/jogos');
  }, [router]);

  return (
    <div className="p-8 text-center text-gray-500">
      Redirecionando para gestão de jogos...
    </div>
  );
}
