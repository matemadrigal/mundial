'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Spinner } from '@/components/ui';

export default function Perfil() {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    api('/api/me')
      .then((d) => { if (!cancelled) router.replace(`/u/${d.user.id}`); })
      .catch(() => { if (!cancelled) router.replace('/login'); });
    return () => { cancelled = true; };
  }, [router]);
  return <Spinner />;
}
