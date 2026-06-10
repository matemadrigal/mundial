import { NextResponse } from 'next/server';
import { db, dbReady, setSetting, getSetting } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { recalcAllPoints } from '@/lib/sync';
import { scorePrediction } from '@/lib/scoring';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user?.is_admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const quota = await getSetting('api_quota');
  const lastSync = await getSetting('last_sync');
  const result = await getSetting('tournament_result');
  return NextResponse.json({ quota, lastSync, result });
}

export async function POST(req) {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user?.is_admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sb = db();

  // Corrección manual de un partido (protegida frente al sync)
  if (body.action === 'set_result') {
    const matchId = Number(body.match_id);
    if (!matchId) return NextResponse.json({ error: 'match_id requerido' }, { status: 400 });

    const patch = {
      status: 'FT',
      home_goals: Number(body.home_goals) || 0,
      away_goals: Number(body.away_goals) || 0,
      total_corners: body.total_corners === '' || body.total_corners == null ? null : Number(body.total_corners),
      home_cards: body.home_cards === '' || body.home_cards == null ? null : Number(body.home_cards),
      away_cards: body.away_cards === '' || body.away_cards == null ? null : Number(body.away_cards),
      stats_ready: true,
      manual_override: true
    };
    await sb.from('matches').update(patch).eq('id', matchId);

    const { data: match } = await sb.from('matches').select('*').eq('id', matchId).maybeSingle();
    const { data: preds } = await sb.from('predictions').select('*').eq('match_id', matchId);
    for (const p of preds || []) {
      const { points } = scorePrediction(p, match);
      await sb.from('predictions').update({ points, scored: true }).eq('id', p.id);
    }
    return NextResponse.json({ ok: true });
  }

  // Desbloquear un partido para que el sync vuelva a gestionarlo
  if (body.action === 'release_override') {
    await sb.from('matches').update({ manual_override: false }).eq('id', Number(body.match_id));
    return NextResponse.json({ ok: true });
  }

  // Campeón y pichichi reales (al final del torneo)
  if (body.action === 'set_tournament_result') {
    await setSetting('tournament_result', {
      champion: body.champion || null,
      top_scorer: body.top_scorer || null
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'recalc_all') {
    await recalcAllPoints();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'acción desconocida' }, { status: 400 });
}
