import { NextResponse } from 'next/server';
import { db, dbReady, getSetting } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { GLOBAL_POINTS } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export async function GET() {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sb = db();
  const { data: users } = await sb.from('users').select('id,name,emoji');
  const { data: preds } = await sb.from('predictions').select('user_id,points,scored,home_goals,away_goals,match_id');
  const { data: matches } = await sb.from('matches').select('id,home_goals,away_goals');
  const { data: globals } = await sb.from('global_predictions').select('*');
  const result = await getSetting('tournament_result'); // {champion, top_scorer} cuando acabe

  const matchById = Object.fromEntries((matches || []).map((m) => [m.id, m]));

  const rows = (users || []).map((u) => {
    const mine = (preds || []).filter((p) => p.user_id === u.id);
    const scored = mine.filter((p) => p.scored);
    const matchPoints = scored.reduce((acc, p) => acc + (p.points || 0), 0);
    const exacts = scored.filter((p) => {
      const m = matchById[p.match_id];
      return m && m.home_goals === p.home_goals && m.away_goals === p.away_goals;
    }).length;

    let globalPoints = 0;
    const g = (globals || []).find((x) => x.user_id === u.id);
    if (g && result) {
      if (result.champion && norm(g.champion) === norm(result.champion)) globalPoints += GLOBAL_POINTS.champion;
      if (result.top_scorer && g.top_scorer) {
        const a = norm(g.top_scorer); const b = norm(result.top_scorer);
        if (a === b || a.includes(b) || b.includes(a)) globalPoints += GLOBAL_POINTS.top_scorer;
      }
    }

    return {
      id: u.id,
      name: u.name,
      emoji: u.emoji,
      matchPoints,
      globalPoints,
      total: matchPoints + globalPoints,
      exacts,
      played: scored.length
    };
  });

  rows.sort((a, b) => b.total - a.total || b.exacts - a.exacts || a.name.localeCompare(b.name));
  return NextResponse.json({ rows, result });
}
