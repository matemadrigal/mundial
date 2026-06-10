import { NextResponse } from 'next/server';
import { dbReady, getSetting } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { runSync, recalcAllPoints } from '@/lib/sync';
import { apiReady } from '@/lib/apifootball';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Llamable por: el admin (cookie), el cron de Vercel, o un cron
// externo con ?secret=SYNC_SECRET (p. ej. cron-job.org cada 15 min)
export async function GET(req) {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });

  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  const isCronVercel = req.headers.get('user-agent')?.includes('vercel-cron');
  const secretOk = process.env.SYNC_SECRET && secret === process.env.SYNC_SECRET;

  let isAdmin = false;
  if (!secretOk && !isCronVercel) {
    const user = await currentUser();
    isAdmin = Boolean(user?.is_admin);
    if (!isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // El user-agent del cron es falsificable: a quien entre solo por esa vía
  // (sin secret ni cookie de admin) se le aplica un throttle de 5 min para
  // que nadie pueda quemar la cuota diaria de la API a base de llamadas.
  if (isCronVercel && !secretOk && !isAdmin) {
    const last = await getSetting('last_sync');
    const age = last ? Date.now() - new Date(last.at).getTime() : Infinity;
    if (age < 5 * 60 * 1000) {
      return NextResponse.json({ ok: false, reason: 'throttled' });
    }
  }

  if (!apiReady()) {
    return NextResponse.json({ ok: false, reason: 'Falta APIFOOTBALL_KEY en las variables de entorno.' }, { status: 200 });
  }

  const mode = url.searchParams.get('mode') === 'full' ? 'full' : 'light';
  const result = await runSync(mode);
  if (url.searchParams.get('recalc') === '1') await recalcAllPoints();

  const quota = await getSetting('api_quota');
  return NextResponse.json({ ...result, quota });
}
