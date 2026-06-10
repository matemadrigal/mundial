import { redirect } from 'next/navigation';
import { dbReady } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!dbReady()) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6">
        <div className="ticket p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🏗️</div>
          <h1 className="display text-2xl text-gold mb-3">CASI LISTO</h1>
          <p className="text-sm opacity-80 leading-relaxed">
            Falta conectar la base de datos. Añade <b>SUPABASE_URL</b> y{' '}
            <b>SUPABASE_SERVICE_KEY</b> en las variables de entorno de Vercel y redespliega.
          </p>
        </div>
      </main>
    );
  }
  const user = await currentUser();
  redirect(user ? '/calendario' : '/login');
}
