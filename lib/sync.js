// ============================================================
// MOTOR DE SYNC
//  - mode 'light': fixtures de ayer..mañana (1 request) + stats
//    de partidos recién acabados. Para tiempo real.
//  - mode 'full': todos los fixtures del torneo. 1 vez al día
//    o desde el panel admin (carga inicial, eliminatorias nuevas).
//  - Throttle + candado para no quemar las 100 requests/día.
//  - Tras cada partido con datos completos, recalcula puntos.
// ============================================================
import { db, getSetting, setSetting } from './db';
import { apiReady, fetchFixtures, fetchMatchStats, simplifyStatus } from './apifootball';
import { scorePrediction, FINISHED } from './scoring';

const LIGHT_THROTTLE_MS = 8 * 60 * 1000;   // mínimo 8 min entre syncs light
const IDLE_THROTTLE_MS = 6 * 60 * 60 * 1000; // 6 h si no hay partidos cerca

function dateStr(d) {
  return d.toISOString().slice(0, 10);
}

function mapFixture(f) {
  return {
    id: f.fixture.id,
    stage: f.league?.round || null,
    kickoff: f.fixture.date,
    stadium: f.fixture.venue?.name || null,
    city: f.fixture.venue?.city || null,
    home_team: f.teams?.home?.name,
    away_team: f.teams?.away?.name,
    home_logo: f.teams?.home?.logo || null,
    away_logo: f.teams?.away?.logo || null,
    status: simplifyStatus(f.fixture.status?.short || 'NS'),
    home_goals: f.goals?.home,
    away_goals: f.goals?.away,
    penalty_winner:
      f.score?.penalty?.home != null && f.score?.penalty?.away != null
        ? (f.score.penalty.home > f.score.penalty.away ? 'home' : 'away')
        : null
  };
}

async function recalcMatchPoints(matchId) {
  const sb = db();
  const { data: match } = await sb.from('matches').select('*').eq('id', matchId).maybeSingle();
  if (!match || match.home_goals == null) return;

  const { data: preds } = await sb.from('predictions').select('*').eq('match_id', matchId);
  for (const p of preds || []) {
    const { points } = scorePrediction(p, match);
    await sb.from('predictions').update({ points, scored: true }).eq('id', p.id);
  }
}

export async function recalcAllPoints() {
  const sb = db();
  const { data: finished } = await sb
    .from('matches')
    .select('id')
    .in('status', FINISHED);
  for (const m of finished || []) await recalcMatchPoints(m.id);
}

export async function runSync(mode = 'light') {
  if (!apiReady()) return { ok: false, reason: 'no_api_key' };
  const sb = db();

  // Candado: evita syncs simultáneos desde varias visitas
  const lock = await getSetting('sync_lock');
  if (lock && Date.now() - new Date(lock.at).getTime() < 90 * 1000) {
    return { ok: false, reason: 'locked' };
  }
  await setSetting('sync_lock', { at: new Date().toISOString() });

  try {
    // 1) Fixtures
    let fixtures;
    if (mode === 'full') {
      fixtures = await fetchFixtures();
    } else {
      const from = new Date(Date.now() - 24 * 3600 * 1000);
      const to = new Date(Date.now() + 36 * 3600 * 1000);
      fixtures = await fetchFixtures({ from: dateStr(from), to: dateStr(to) });
    }

    let updated = 0;
    const justFinished = [];

    for (const f of fixtures) {
      const row = mapFixture(f);
      if (!row.home_team || !row.away_team) continue;

      const { data: existing } = await sb
        .from('matches')
        .select('id,status,stats_ready,manual_override')
        .eq('id', row.id)
        .maybeSingle();

      // El admin manda: si corrigió a mano, el sync no toca ese partido
      if (existing?.manual_override) continue;

      await sb.from('matches').upsert(row);
      updated++;

      const isFinished = FINISHED.includes(row.status);
      if (isFinished && !(existing && existing.stats_ready)) {
        justFinished.push(row.id);
      }
    }

    // 2) Stats (córners y tarjetas) de partidos acabados sin stats — máx 8 por sync
    let statsFetched = 0;
    for (const matchId of justFinished.slice(0, 8)) {
      try {
        const stats = await fetchMatchStats(matchId);
        if (stats) {
          await sb.from('matches').update({
            total_corners: stats.homeCorners + stats.awayCorners,
            home_cards: stats.homeCards,
            away_cards: stats.awayCards,
            stats_ready: true
          }).eq('id', matchId);
          statsFetched++;
        }
      } catch (e) {
        // stats aún no disponibles: se reintenta en el próximo sync
      }
      await recalcMatchPoints(matchId);
    }

    await setSetting('last_sync', { at: new Date().toISOString(), mode, updated, statsFetched });
    return { ok: true, mode, updated, statsFetched };
  } finally {
    await setSetting('sync_lock', { at: new Date(0).toISOString() });
  }
}

// Sync "perezoso": se dispara al visitar la web si los datos están viejos.
// Solo gasta requests cuando hay partidos cerca (ventana de juego).
export async function maybeLazySync() {
  if (!apiReady()) return;
  const last = await getSetting('last_sync');
  const age = last ? Date.now() - new Date(last.at).getTime() : Infinity;
  if (age < LIGHT_THROTTLE_MS) return;

  const sb = db();
  const now = new Date();
  const windowStart = new Date(now.getTime() - 4 * 3600 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 2 * 3600 * 1000).toISOString();
  const { data: nearby } = await sb
    .from('matches')
    .select('id')
    .gte('kickoff', windowStart)
    .lte('kickoff', windowEnd)
    .limit(1);

  const hasNearbyMatches = (nearby || []).length > 0;
  const { count } = await sb.from('matches').select('id', { count: 'exact', head: true });
  const emptyDb = !count;

  if (emptyDb) { await runSync('full'); return; }
  if (hasNearbyMatches || age > IDLE_THROTTLE_MS) {
    await runSync('light');
  }
}
