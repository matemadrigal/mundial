// ============================================================
// Cliente de datos del Mundial: TheSportsDB v1 (clave pública "3")
// El archivo conserva el nombre y la firma original (apiReady,
// fetchFixtures, fetchMatchStats, simplifyStatus, fetchTopScorer)
// para no romper lib/sync.js. Internamente ya no usa API-Football.
//
// Razón del cambio: el plan Free de API-Football no incluye la
// season 2026 del Mundial. TheSportsDB sirve calendario, equipos,
// venues y marcadores finales gratis. Córners y tarjetas no están
// disponibles en su tier público: el admin los introduce a mano.
// ============================================================
import { setSetting } from './db';

const BASE = 'https://www.thesportsdb.com/api/v1/json';
const KEY = process.env.SPORTSDB_KEY || '3';
const LEAGUE_ID = '4429';   // FIFA World Cup
const SEASON = '2026';

// Mantenemos exportadas estas constantes por compatibilidad; ya no se usan.
export const LEAGUE = LEAGUE_ID;

// La clave pública "3" siempre funciona, así que la API está lista por defecto.
export function apiReady() {
  return true;
}

async function call(path) {
  const res = await fetch(`${BASE}/${KEY}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`TheSportsDB ${res.status}`);
  const json = await res.json();
  return json;
}

// Mapeo de intRound (TheSportsDB) -> string compatible con stageES()
function roundToStage(intRound) {
  const n = Number(intRound);
  if (!Number.isFinite(n)) return null;
  // En las copas de TheSportsDB:
  //   1, 2, 3 = jornadas 1-3 de fase de grupos
  //   125 = dieciseisavos · 16 = octavos · 8 = cuartos
  //   4 = semis · 3 = 3er puesto · 2 = final
  if (n >= 1 && n <= 3) return `Group Stage - Jornada ${n}`;
  if (n === 125) return 'Round of 32';
  if (n === 16) return 'Round of 16';
  if (n === 8) return 'Quarter-finals';
  if (n === 4) return 'Semi-finals';
  if (n === 3) return '3rd Place';
  if (n === 2) return 'Final';
  return `Round ${n}`;
}

// strStatus de TheSportsDB -> estado simple de la app (NS/LIVE/HT/FT/AET/PEN)
function mapStatus(s) {
  if (!s) return 'NS';
  const x = String(s).toUpperCase();
  if (x === 'NS' || x === 'NOT STARTED' || x === '') return 'NS';
  if (x === 'HT' || x.includes('HALF')) return 'HT';
  if (x === 'FT' || x.includes('FINISHED') || x === 'MATCH FINISHED') return 'FT';
  if (x.includes('EXTRA') || x === 'AET') return 'AET';
  if (x.includes('PEN')) return 'PEN';
  if (x === '1H' || x === '2H' || x === 'ET' || x === 'LIVE' || x.includes('PLAY')) return 'LIVE';
  if (x.includes('POSTPON')) return 'PST';
  if (x.includes('CANCEL')) return 'CANC';
  return x;
}

// Construye un objeto con la forma que esperaba lib/sync.js de API-Football.
function toFixture(e) {
  const iso = e.strTimestamp
    ? new Date(e.strTimestamp + (e.strTimestamp.endsWith('Z') ? '' : 'Z')).toISOString()
    : (e.dateEvent && e.strTime
        ? new Date(`${e.dateEvent}T${e.strTime}Z`).toISOString()
        : null);

  return {
    fixture: {
      id: Number(e.idEvent),
      date: iso,
      venue: {
        name: e.strVenue || null,
        city: e.strCountry || null
      },
      status: { short: mapStatus(e.strStatus) }
    },
    league: { round: roundToStage(e.intRound) },
    teams: {
      home: { name: e.strHomeTeam, logo: e.strHomeTeamBadge || null },
      away: { name: e.strAwayTeam, logo: e.strAwayTeamBadge || null }
    },
    goals: {
      home: e.intHomeScore != null && e.intHomeScore !== '' ? Number(e.intHomeScore) : null,
      away: e.intAwayScore != null && e.intAwayScore !== '' ? Number(e.intAwayScore) : null
    },
    score: { penalty: { home: null, away: null } }
  };
}

// Devuelve un array de fixtures con la misma forma que API-Football.
// El parámetro { from, to } se conserva en la firma pero TheSportsDB no
// permite filtrar por rango en este endpoint; filtramos en memoria.
export async function fetchFixtures({ from, to } = {}) {
  const json = await call(`/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`);

  // Notamos en settings que TheSportsDB no tiene cuota explícita; dejamos
  // la marca para que el panel admin pueda mostrar "sin cuota" si quiere.
  setSetting('api_quota', { source: 'TheSportsDB', remaining: '∞', limit: '∞', at: new Date().toISOString() }).catch(() => {});

  const events = (json && json.events) || [];
  let fixtures = events.map(toFixture).filter((f) => f.fixture.id && f.teams.home.name && f.teams.away.name);

  if (from && to) {
    const f0 = new Date(from + 'T00:00:00Z').getTime();
    const f1 = new Date(to + 'T23:59:59Z').getTime();
    fixtures = fixtures.filter((f) => {
      const t = f.fixture.date ? new Date(f.fixture.date).getTime() : 0;
      return t >= f0 && t <= f1;
    });
  }

  return fixtures;
}

// TheSportsDB no expone córners ni tarjetas en su plan gratuito.
// Devolvemos null y el admin los introduce desde la "Sala VAR".
export async function fetchMatchStats(_fixtureId) {
  return null;
}

// Tampoco hay endpoint de máximo goleador en el tier público.
// Si en el futuro lo añaden o subimos de tier, este es el punto a tocar.
export async function fetchTopScorer() {
  return null;
}

// Detalle ampliado de un evento. Aporta cosas que el listado de season
// no incluye: strGroup (letra real FIFA: A-L), strCity preciso,
// strDescriptionEN y los IDs de cada selección (útiles para "últimos
// partidos" de cada equipo).
export async function fetchEventDetail(eventId) {
  const json = await call(`/lookupevent.php?id=${eventId}`);
  return (json && json.events && json.events[0]) || null;
}

// Últimos partidos jugados por una selección. TheSportsDB devuelve hasta
// 5 eventos pero en tier free a veces solo trae 1-2 para selecciones
// nacionales que no compiten cada semana — devolvemos lo que haya.
export async function fetchTeamLast(teamId) {
  const json = await call(`/eventslast.php?id=${teamId}`);
  return (json && json.results) || [];
}

// Alineaciones. En tier free suele venir null para partidos
// internacionales; el endpoint funciona, simplemente no hay datos.
// Si en algún momento se publican o se sube de tier, esto las saca.
export async function fetchLineup(eventId) {
  const json = await call(`/lookuplineup.php?id=${eventId}`);
  return (json && json.lineup) || null;
}

// Compat con el código existente.
export function simplifyStatus(short) {
  const live = ['1H', '2H', 'ET', 'BT', 'P', 'LIVE'];
  if (live.includes(short)) return 'LIVE';
  return short;
}
