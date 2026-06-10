import { NextResponse } from 'next/server';
import { db, dbReady, getSetting } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { maybeLazySync } from '@/lib/sync';
import { apiReady } from '@/lib/apifootball';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Sync perezoso: mantiene los datos frescos sin cron externo
  try { await maybeLazySync(); } catch (e) {}

  const sb = db();
  const { data: matches } = await sb.from('matches').select('*').order('kickoff', { ascending: true });
  const { data: allPreds } = await sb
    .from('predictions')
    .select('match_id,user_id,home_goals,away_goals,corners,more_cards,points,scored');
  const { data: users } = await sb.from('users').select('id,name,emoji');

  const now = Date.now();
  const started = new Set(
    (matches || []).filter((m) => new Date(m.kickoff).getTime() <= now).map((m) => m.id)
  );

  const mine = {};
  const others = {};
  for (const p of allPreds || []) {
    if (p.user_id === user.id) mine[p.match_id] = p;
    // Las predicciones ajenas solo se revelan cuando el partido ya empezó
    if (started.has(p.match_id)) {
      if (!others[p.match_id]) others[p.match_id] = [];
      others[p.match_id].push(p);
    }
  }

  const lastSync = await getSetting('last_sync');
  return NextResponse.json({
    matches: matches || [],
    mine,
    others,
    users: users || [],
    me: user,
    apiConfigured: apiReady(),
    lastSync
  });
}
