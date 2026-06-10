import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { scorePrediction } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const targetId = Number(params.id);
  if (!Number.isInteger(targetId)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const sb = db();
  const { data: target } = await sb.from('users').select('id,name,emoji').eq('id', targetId).maybeSingle();
  if (!target) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const [{ data: preds }, { data: matches }] = await Promise.all([
    sb.from('predictions').select('*').eq('user_id', targetId),
    sb.from('matches').select('*')
  ]);

  const matchById = Object.fromEntries((matches || []).map((m) => [m.id, m]));

  // Anti-trampas: solo revelar predicciones cuyo partido ya empezó.
  const now = Date.now();
  const items = (preds || [])
    .map((p) => {
      const m = matchById[p.match_id];
      if (!m) return null;
      const started = new Date(m.kickoff).getTime() <= now;
      if (!started) return { hidden: true, match_id: p.match_id, kickoff: m.kickoff, stage: m.stage, home_team: m.home_team, away_team: m.away_team };
      const evaluable = m.home_goals != null && m.away_goals != null;
      const score = evaluable ? scorePrediction(p, m) : { points: 0, detail: [] };
      return {
        match: {
          id: m.id, stage: m.stage, kickoff: m.kickoff, status: m.status,
          home_team: m.home_team, away_team: m.away_team,
          home_goals: m.home_goals, away_goals: m.away_goals,
          total_corners: m.total_corners, home_cards: m.home_cards, away_cards: m.away_cards,
          stats_ready: m.stats_ready
        },
        pred: {
          home_goals: p.home_goals, away_goals: p.away_goals,
          corners: p.corners, more_cards: p.more_cards
        },
        points: score.points,
        detail: score.detail
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date((b.match || b).kickoff) - new Date((a.match || a).kickoff));

  const visible = items.filter((x) => !x.hidden);
  const hiddenCount = items.filter((x) => x.hidden).length;

  // Estadísticas agregadas
  let totalPts = 0, exacts = 0, ones = 0, cornersExact = 0, cornersClose = 0, cardsHit = 0;
  let best = null;
  for (const it of visible) {
    if (it.points > 0) {
      totalPts += it.points;
      if (!best || it.points > best.points) best = it;
    }
    if (it.detail.some((d) => d.label === 'Resultado exacto')) exacts++;
    if (it.detail.some((d) => d.label === '1X2')) ones++;
    if (it.detail.some((d) => d.label === 'Córners exactos')) cornersExact++;
    if (it.detail.some((d) => d.label === 'Córners ±2')) cornersClose++;
    if (it.detail.some((d) => d.label === 'Más tarjetas')) cardsHit++;
  }
  const finishedAndScored = visible.filter((x) => x.match.home_goals != null).length;

  return NextResponse.json({
    target,
    isMe: user.id === target.id,
    stats: { totalPts, exacts, ones, cornersExact, cornersClose, cardsHit, finishedAndScored, predicted: visible.length, pending: hiddenCount },
    best,
    items: visible
  });
}
