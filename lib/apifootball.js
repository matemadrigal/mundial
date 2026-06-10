// Cliente mínimo de API-Football (v3.football.api-sports.io)
// Mundial 2026 = league 1, season 2026
import { setSetting } from './db';

const BASE = 'https://v3.football.api-sports.io';
export const LEAGUE = 1;
export const SEASON = 2026;

export function apiReady() {
  return Boolean(process.env.APIFOOTBALL_KEY);
}

async function call(path, params = {}) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': process.env.APIFOOTBALL_KEY },
    cache: 'no-store'
  });

  // Guardamos cuota restante para mostrarla en el panel admin
  const remaining = res.headers.get('x-ratelimit-requests-remaining');
  const limit = res.headers.get('x-ratelimit-requests-limit');
  if (remaining != null) {
    setSetting('api_quota', { remaining, limit, at: new Date().toISOString() }).catch(() => {});
  }

  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error('API-Football: ' + JSON.stringify(json.errors));
  }
  return json.response || [];
}

// Todos los fixtures del Mundial, o filtrados por rango de fechas (YYYY-MM-DD)
export async function fetchFixtures({ from, to } = {}) {
  const params = { league: LEAGUE, season: SEASON };
  if (from && to) { params.from = from; params.to = to; }
  return call('/fixtures', params);
}

// Estadísticas de un partido: córners y tarjetas por equipo
export async function fetchMatchStats(fixtureId) {
  const rows = await call('/fixtures/statistics', { fixture: fixtureId });
  if (!rows || rows.length < 2) return null;

  const get = (teamRow, type) => {
    const s = (teamRow.statistics || []).find((x) => x.type === type);
    const v = s ? s.value : null;
    return v == null ? 0 : Number(v) || 0;
  };

  const [a, b] = rows;
  return {
    homeCorners: get(a, 'Corner Kicks'),
    awayCorners: get(b, 'Corner Kicks'),
    homeCards: get(a, 'Yellow Cards') + get(a, 'Red Cards'),
    awayCards: get(b, 'Yellow Cards') + get(b, 'Red Cards')
  };
}

// Máximo goleador actual del torneo (para el pichichi)
export async function fetchTopScorer() {
  const rows = await call('/players/topscorers', { league: LEAGUE, season: SEASON });
  const top = rows && rows[0];
  if (!top) return null;
  return {
    name: top.player?.name || null,
    goals: top.statistics?.[0]?.goals?.total ?? null,
    team: top.statistics?.[0]?.team?.name || null
  };
}

// Estados de la API -> estado simple de la app
export function simplifyStatus(short) {
  const live = ['1H', '2H', 'ET', 'BT', 'P', 'LIVE'];
  if (live.includes(short)) return 'LIVE';
  return short; // NS, HT, FT, AET, PEN, PST, CANC...
}
