import { redirect } from 'next/navigation';
import { dbReady } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!dbReady()) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="ticket p-8 max-w-md w-full">
          <div className="eyebrow mb-3">SETUP PENDIENTE</div>
          <h1 className="display text-2xl mb-3">Base de datos no conectada</h1>
          <p className="text-sm text-muted leading-relaxed">
            Añade las variables <span className="mono text-ink">SUPABASE_URL</span> y{' '}
            <span className="mono text-ink">SUPABASE_SERVICE_KEY</span> en Vercel y redespliega para activar la app.
          </p>
        </div>
      </main>
    );
  }
  const user = await currentUser();
  redirect(user ? '/calendario' : '/login');
}
