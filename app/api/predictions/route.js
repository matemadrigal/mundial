import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const matchId = Number(body.match_id);
  const hg = Number(body.home_goals);
  const ag = Number(body.away_goals);

  if (!matchId || !Number.isInteger(hg) || !Number.isInteger(ag) || hg < 0 || ag < 0 || hg > 20 || ag > 20) {
    return NextResponse.json({ error: 'Predicción inválida.' }, { status: 400 });
  }

  const sb = db();
  const { data: match } = await sb.from('matches').select('id,kickoff').eq('id', matchId).maybeSingle();
  if (!match) return NextResponse.json({ error: 'Partido no encontrado.' }, { status: 404 });

  // Candado anti-trampas: el servidor comprueba el kickoff, no el navegador
  if (new Date(match.kickoff).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'El partido ya ha empezado. Predicciones cerradas.' }, { status: 403 });
  }

  const corners = body.corners === null || body.corners === '' || body.corners === undefined
    ? null : Math.max(0, Math.min(40, Number(body.corners) || 0));
  const moreCards = ['home', 'away', 'draw'].includes(body.more_cards) ? body.more_cards : null;

  await sb.from('predictions').upsert(
    {
      user_id: user.id,
      match_id: matchId,
      home_goals: hg,
      away_goals: ag,
      corners,
      more_cards: moreCards,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id,match_id' }
  );

  return NextResponse.json({ ok: true });
}
