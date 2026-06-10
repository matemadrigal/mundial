import { NextResponse } from 'next/server';
import { dbReady } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { fetchEventDetail, fetchTeamLast, fetchLineup } from '@/lib/apifootball';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Devuelve detalle ampliado de un partido para la vista expandida:
// metadatos (póster, descripción, ciudad real, grupo FIFA), forma
// reciente de cada selección y alineaciones si están publicadas.
export async function GET(_req, { params }) {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  let detail = null;
  try { detail = await fetchEventDetail(id); } catch {}
  if (!detail) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const [homeLast, awayLast, lineup] = await Promise.all([
    detail.idHomeTeam ? fetchTeamLast(detail.idHomeTeam).catch(() => []) : Promise.resolve([]),
    detail.idAwayTeam ? fetchTeamLast(detail.idAwayTeam).catch(() => []) : Promise.resolve([]),
    fetchLineup(id).catch(() => null)
  ]);

  // Aplanamos el evento al subset relevante (la respuesta cruda es enorme)
  const event = {
    id: Number(detail.idEvent),
    group: detail.strGroup || null,
    venue: detail.strVenue || null,
    city: detail.strCity || null,
    description: detail.strDescriptionEN || null,
    poster: detail.strPoster || null,
    thumb: detail.strThumb || null,
    banner: detail.strBanner || null,
    homeTeam: detail.strHomeTeam,
    awayTeam: detail.strAwayTeam,
    homeBadge: detail.strHomeTeamBadge || null,
    awayBadge: detail.strAwayTeamBadge || null
  };

  const summarizeForm = (events, name) => (events || []).slice(0, 5).map((e) => {
    const isHome = e.strHomeTeam === name;
    const my = isHome ? Number(e.intHomeScore) : Number(e.intAwayScore);
    const opp = isHome ? Number(e.intAwayScore) : Number(e.intHomeScore);
    const oppName = isHome ? e.strAwayTeam : e.strHomeTeam;
    let result = 'D';
    if (Number.isFinite(my) && Number.isFinite(opp)) {
      if (my > opp) result = 'W';
      else if (my < opp) result = 'L';
    } else {
      result = '·';
    }
    return {
      id: e.idEvent,
      date: e.dateEvent,
      league: e.strLeague,
      opponent: oppName,
      my: Number.isFinite(my) ? my : null,
      opp: Number.isFinite(opp) ? opp : null,
      result
    };
  });

  return NextResponse.json({
    event,
    homeForm: summarizeForm(homeLast, detail.strHomeTeam),
    awayForm: summarizeForm(awayLast, detail.strAwayTeam),
    lineup
  });
}
