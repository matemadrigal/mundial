import { NextResponse } from 'next/server';
import { db, dbReady, getSetting } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// El cierre de las apuestas globales es el kickoff del primer partido
async function lockTime(sb) {
  const { data } = await sb.from('matches').select('kickoff').order('kickoff', { ascending: true }).limit(1);
  return data && data[0] ? new Date(data[0].kickoff).getTime() : null;
}

export async function GET() {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = db();
  const lock = await lockTime(sb);
  const locked = lock != null && Date.now() >= lock;

  const { data: mine } = await sb.from('global_predictions').select('*').eq('user_id', user.id).maybeSingle();

  // Equipos disponibles para el selector de campeón
  const { data: matches } = await sb.from('matches').select('home_team,away_team');
  const teams = Array.from(
    new Set((matches || []).flatMap((m) => [m.home_team, m.away_team]).filter(Boolean))
  ).sort();

  let everyone = null;
  if (locked) {
    const { data: all } = await sb.from('global_predictions').select('*');
    const { data: users } = await sb.from('users').select('id,name,emoji');
    everyone = (all || []).map((g) => ({ ...g, user: (users || []).find((u) => u.id === g.user_id) }));
  }

  const result = await getSetting('tournament_result');
  return NextResponse.json({ mine: mine || null, locked, lockAt: lock, teams, everyone, result });
}

export async function POST(req) {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = db();
  const lock = await lockTime(sb);
  if (lock != null && Date.now() >= lock) {
    return NextResponse.json({ error: 'El Mundial ya ha empezado: apuestas globales cerradas. 🔒' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const champion = String(body.champion || '').slice(0, 60) || null;
  const topScorer = String(body.top_scorer || '').slice(0, 60) || null;

  await sb.from('global_predictions').upsert({
    user_id: user.id,
    champion,
    top_scorer: topScorer,
    updated_at: new Date().toISOString()
  });

  return NextResponse.json({ ok: true });
}
