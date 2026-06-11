'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, fmtTime, fmtDayLong, dayKey, tournamentDay, BottomNav, Spinner, Avatar, Logout, Flag } from '@/components/ui';
import { PredictionForm, SHORT_LABEL, MatchExtras, BetSheet } from '@/components/match';
import { teamName, stageES } from '@/lib/teams';
import { scorePrediction } from '@/lib/scoring';

const FINISHED = ['FT', 'AET', 'PEN'];

// ===== Tabla de grupos =====
const ALL_GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function tableFromMatches(teamSet, matchesIn, label, provisional) {
  const teams = Array.from(teamSet);
  const stats = Object.fromEntries(teams.map((t) => [t, { team: t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }]));
  const decisive = matchesIn.filter((m) => m.home_goals != null && m.away_goals != null);
  for (const m of decisive) {
    const h = stats[m.home_team]; const a = stats[m.away_team];
    h.pj++; a.pj++;
    h.gf += m.home_goals; h.gc += m.away_goals;
    a.gf += m.away_goals; a.gc += m.home_goals;
    if (m.home_goals > m.away_goals) { h.g++; a.p++; h.pts += 3; }
    else if (m.away_goals > m.home_goals) { a.g++; h.p++; a.pts += 3; }
    else { h.e++; a.e++; h.pts++; a.pts++; }
  }
  const sorted = teams.map((t) => stats[t]).sort((x, y) =>
    (y.pts - x.pts) || ((y.gf - y.gc) - (x.gf - x.gc)) || (y.gf - x.gf) || x.team.localeCompare(y.team)
  );
  // Rellena hasta 4 ranuras con placeholders "Por confirmar".
  while (sorted.length < 4) {
    sorted.push({ team: null, pj: null, g: null, e: null, p: null, gf: null, gc: null, pts: null, placeholder: true });
  }
  return { teams: sorted, complete: teamSet.size === 4, played: matchesIn.length, label, provisional };
}

function buildGroupTables(matches) {
  const groupMatches = (matches || []).filter((m) =>
    /group|jornada|fase de grupos/i.test(m.stage || '') && m.home_team && m.away_team
  );

  // 1) Por letra real (A-L)
  const byLetter = new Map();
  const unlabeled = [];
  for (const m of groupMatches) {
    const letter = (m.stage || '').match(/group\s+([A-L])\b/i)?.[1]?.toUpperCase();
    if (letter) {
      if (!byLetter.has(letter)) byLetter.set(letter, []);
      byLetter.get(letter).push(m);
    } else {
      unlabeled.push(m);
    }
  }

  // 2) Construir SIEMPRE 12 grupos (A-L), aunque la API aún no haya
  //    publicado los partidos de la jornada — los huecos salen como
  //    "Por confirmar" para que el esqueleto del Mundial esté completo
  //    desde el primer día.
  const tables = [];
  for (const letter of ALL_GROUP_LETTERS) {
    const ms = byLetter.get(letter) || [];
    const teamSet = new Set();
    for (const m of ms) { teamSet.add(m.home_team); teamSet.add(m.away_team); }
    tables.push(tableFromMatches(teamSet, ms, letter, false));
  }

  // 3) Fallback BFS para partidos sin letra (raros: enriquecimiento
  //    aún no corrido). Aparecen como "Grupo ?" debajo de A-L.
  if (unlabeled.length > 0) {
    const adj = new Map();
    for (const m of unlabeled) {
      if (!adj.has(m.home_team)) adj.set(m.home_team, new Set());
      if (!adj.has(m.away_team)) adj.set(m.away_team, new Set());
      adj.get(m.home_team).add(m.away_team);
      adj.get(m.away_team).add(m.home_team);
    }
    const visited = new Set();
    const comps = [];
    for (const team of adj.keys()) {
      if (visited.has(team)) continue;
      const comp = new Set();
      const queue = [team];
      while (queue.length) {
        const t = queue.shift();
        if (visited.has(t)) continue;
        visited.add(t);
        comp.add(t);
        for (const n of adj.get(t) || []) if (!visited.has(n)) queue.push(n);
      }
      comps.push(comp);
    }
    for (const comp of comps) {
      const ms = unlabeled.filter((x) => comp.has(x.home_team) && comp.has(x.away_team));
      tables.push(tableFromMatches(comp, ms, '?', true));
    }
  }

  return tables;
}

function GroupStandings({ matches }) {
  const tables = useMemo(() => buildGroupTables(matches), [matches]);
  const hasProvisional = tables.some((g) => g.provisional);
  const incomplete = tables.filter((g) => !g.provisional && g.teams.some((t) => t.placeholder)).length;
  return (
    <div className="px-4 pt-3 space-y-3">
      {incomplete > 0 ? (
        <p className="text-[11px] text-dim2 leading-relaxed">
          Algunos equipos aparecen como <span className="font-display">Por confirmar</span> porque la fuente de datos
          aún no ha publicado todos los cruces. Se rellenan automáticamente conforme la API libere las jornadas restantes.
        </p>
      ) : null}
      {hasProvisional ? (
        <p className="text-[11px] text-dim2 leading-relaxed">
          Grupos sin letra (<span className="font-display">?</span>) se enriquecen al ejecutar "Sync completo" desde Admin.
        </p>
      ) : null}
      {tables.map((g, i) => {
        const knownCount = g.teams.filter((t) => !t.placeholder).length;
        return (
          <section key={`${g.label}-${i}`} className="card overflow-hidden">
            <div className="flex items-baseline justify-between px-4 pt-3 pb-2">
              <h3 className="display text-base">Grupo {g.label}</h3>
              <span className="text-[10px] text-dim2 font-bold tracking-widest">
                {knownCount}/4 EQUIPOS · {g.played} PJ
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="eyebrow text-left">
                    <th className="font-normal pb-1.5 pl-4">#</th>
                    <th className="font-normal pb-1.5">Equipo</th>
                    <th className="font-normal pb-1.5 text-center">PJ</th>
                    <th className="font-normal pb-1.5 text-center">G</th>
                    <th className="font-normal pb-1.5 text-center">E</th>
                    <th className="font-normal pb-1.5 text-center">P</th>
                    <th className="font-normal pb-1.5 text-center">GF</th>
                    <th className="font-normal pb-1.5 text-center">GC</th>
                    <th className="font-normal pb-1.5 text-center pr-4">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {g.teams.map((t, idx) => (
                    <tr key={t.team || `tbd-${g.label}-${idx}`} className="border-t border-line2">
                      <td className="py-2.5 pl-4 font-display font-bold text-dim2">{idx + 1}</td>
                      {t.placeholder ? (
                        <>
                          <td className="py-2.5">
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="inline-flex items-center justify-center rounded-[3px] bg-line text-dim2 text-[10px] font-bold" style={{ width: 22, height: 14 }}>?</span>
                              <span className="truncate text-dim2 italic">Por confirmar</span>
                            </span>
                          </td>
                          <td className="py-2.5 text-center text-dim2">—</td>
                          <td className="py-2.5 text-center text-dim2">—</td>
                          <td className="py-2.5 text-center text-dim2">—</td>
                          <td className="py-2.5 text-center text-dim2">—</td>
                          <td className="py-2.5 text-center text-dim2">—</td>
                          <td className="py-2.5 text-center text-dim2">—</td>
                          <td className="py-2.5 text-center text-dim2 pr-4">—</td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5">
                            <span className="flex items-center gap-2 min-w-0">
                              <Flag apiName={t.team} size="xs" />
                              <span className="truncate">{teamName(t.team)}</span>
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-display text-dim">{t.pj}</td>
                          <td className="py-2.5 text-center font-display">{t.g}</td>
                          <td className="py-2.5 text-center font-display">{t.e}</td>
                          <td className="py-2.5 text-center font-display">{t.p}</td>
                          <td className="py-2.5 text-center font-display text-dim">{t.gf}</td>
                          <td className="py-2.5 text-center font-display text-dim">{t.gc}</td>
                          <td className="py-2.5 text-center font-display font-black pr-4">{t.pts}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ===== Resumen del día =====
function TodaySummary({ data }) {
  const today = dayKey(new Date().toISOString());
  const finishedToday = (data.matches || []).filter((m) =>
    dayKey(m.kickoff) === today && FINISHED.includes(m.status) && m.home_goals != null
  );
  if (finishedToday.length === 0) return null;

  const totals = new Map();
  for (const u of data.users || []) totals.set(u.id, { user: u, pts: 0, hits: 0 });
  for (const m of finishedToday) {
    const preds = data.others[m.id] || [];
    for (const p of preds) {
      const r = scorePrediction(p, m);
      const row = totals.get(p.user_id);
      if (row) { row.pts += r.points; if (r.points > 0) row.hits++; }
    }
  }
  const rows = Array.from(totals.values()).sort((a, b) => b.pts - a.pts);

  return (
    <section className="card mx-4 mt-3 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="eyebrow">Resumen del día</div>
          <h2 className="display text-base mt-0.5">Hoy · {finishedToday.length} jugado{finishedToday.length > 1 ? 's' : ''}</h2>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {rows.map((r) => {
          const isMe = r.user.id === data.me.id;
          return (
            <div key={r.user.id} className={`text-center rounded-2xl p-2 ${isMe ? 'bg-pitchHi' : ''}`}>
              <div className="text-[10.5px] text-muted truncate">{r.user.name}</div>
              <div className={`font-display font-black text-xl leading-none mt-1 ${r.pts > 0 ? 'text-pitch-soft-ink' : 'text-dim2'}`}>{r.pts > 0 ? `+${r.pts}` : '0'}</div>
              <div className="text-[9px] text-dim2 tracking-widest mt-1">{r.hits} ACIERTO{r.hits === 1 ? '' : 'S'}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ===== Componentes match =====
function StatusLabel({ match, live, done }) {
  if (live) return <span className="badge-live">{match.status === 'HT' ? 'DESCANSO' : 'EN VIVO'}</span>;
  if (done) return <span className="text-[11px] font-display font-bold tracking-widest text-dim2">FINAL</span>;
  return <span className="font-display font-bold text-[13px] text-ink">{fmtTime(match.kickoff)}</span>;
}

function RevealedPredictions({ match, others, users, meId }) {
  if (!others || others.length === 0) {
    return <p className="text-sm text-dim2 mt-3 text-center">Nadie envió pronóstico para este partido.</p>;
  }
  const realKnown = match.home_goals != null && match.away_goals != null;
  return (
    <div className="mt-4 pt-3 border-t border-line">
      <div className="eyebrow mb-1.5">Pronósticos de la peña</div>
      <div className="space-y-1.5">
        {others
          .slice()
          .sort((a, b) => (b.points || 0) - (a.points || 0))
          .map((p) => {
            const u = users.find((x) => x.id === p.user_id);
            const isMe = p.user_id === meId;
            const live = realKnown ? scorePrediction(p, match) : { points: 0, detail: [] };
            return (
              <div key={p.user_id} className={`rounded-2xl px-3 py-2.5 ${isMe ? 'bg-pitchHi' : ''}`}>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={u?.name} highlightMe={isMe} />
                    <span className="font-semibold truncate">{u?.name}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="font-display font-black text-[15px] text-ink bg-line3 px-2.5 py-1 rounded-lg">{p.home_goals}–{p.away_goals}</span>
                    {p.corners != null ? <span className="text-[11px] text-dim2">c{p.corners}</span> : null}
                    {p.more_cards ? (
                      <span className="text-[11px] text-dim2 flex items-center gap-1">+T <span className="inline-flex items-center">
                        {p.more_cards === 'home' ? <Flag apiName={match.home_team} size="xs" /> :
                         p.more_cards === 'away' ? <Flag apiName={match.away_team} size="xs" /> : <span>=</span>}
                      </span></span>
                    ) : null}
                    {live.points > 0 ? <span className="badge-pts">+{live.points}</span> : null}
                  </span>
                </div>
                {realKnown && live.detail.length > 0 ? (
                  <div className="mt-1 ml-[48px] text-[10.5px] text-dim2 tracking-wide">
                    {live.detail.map((d, i) => (
                      <span key={i}>
                        {i > 0 ? <span className="opacity-50"> · </span> : null}
                        {SHORT_LABEL[d.label] || d.label} <span className="text-pitch-soft-ink font-bold">+{d.pts}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function MatchCard({ match, mine, others, users, meId, onSaved, onOpenBet }) {
  const [open, setOpen] = useState(false);
  const started = new Date(match.kickoff).getTime() <= Date.now();
  const live = match.status === 'LIVE' || match.status === 'HT';
  const done = FINISHED.includes(match.status);
  const klass = `card px-4 py-3.5 cursor-pointer ${live ? 'ticket-live' : ''} ${done ? 'ticket-done' : ''}`;
  const liveEval = (started && mine && match.home_goals != null) ? scorePrediction(mine, match) : null;

  return (
    <article className={klass}>
      <button className="w-full text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="eyebrow">{stageES(match.stage)}</span>
          <StatusLabel match={match} live={live} done={done} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Flag apiName={match.home_team} size="md" shadow />
            <span className="font-display font-bold text-base truncate">{teamName(match.home_team)}</span>
          </div>
          {started || done ? (
            <div className="font-display font-black text-2xl tracking-wide px-2 text-ink min-w-[64px] text-center">
              {match.home_goals ?? 0}<span className="text-dim4 mx-1">–</span>{match.away_goals ?? 0}
            </div>
          ) : (
            <div className="font-display text-sm text-dim4 px-2">vs</div>
          )}
          <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse text-right">
            <Flag apiName={match.away_team} size="md" shadow />
            <span className="font-display font-bold text-base truncate">{teamName(match.away_team)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 gap-3 min-h-[22px] pt-3 border-t border-line2">
          {!started && (mine
            ? <span className="text-[12px] text-dim font-semibold">Tu apuesta · <span className="font-display font-bold text-ink bg-line3 px-2 py-0.5 rounded-md ml-1">{mine.home_goals}-{mine.away_goals}</span></span>
            : <button
                onClick={(e) => { e.stopPropagation(); onOpenBet && onOpenBet(match); }}
                className="btn-dark text-[12px] flex-1 mr-2">+ Predecir resultado</button>)}
          {live && mine ? (
            <span className="text-[12px] font-semibold flex items-center gap-2">
              <span className="text-dim">Tu apuesta · <span className="font-display font-bold text-ink">{mine.home_goals}-{mine.away_goals}</span></span>
              {liveEval && liveEval.points > 0 ? <span className="badge-pts">VAS +{liveEval.points}</span> : <span className="text-[11px] text-dim2">vas 0</span>}
            </span>
          ) : null}
          {done && mine?.scored ? (
            <span className="flex items-center gap-2 text-[12px] font-semibold">
              <span className="text-dim">Tu apuesta · <span className="font-display font-bold text-ink">{mine.home_goals}-{mine.away_goals}</span></span>
              <span className={mine.points >= 3 ? 'badge-pts badge-exact' : mine.points > 0 ? 'badge-pts' : 'badge-pts badge-miss'}>
                {mine.points >= 3 ? `CLAVADO +${mine.points}` : mine.points > 0 ? `+${mine.points}` : 'FALLO'}
              </span>
            </span>
          ) : null}
          {done && match.stats_ready ? (
            <span className="text-[11px] text-dim2 font-display">c{match.total_corners} · T{match.home_cards}-{match.away_cards}</span>
          ) : null}
        </div>
      </button>

      {open && !started ? <PredictionForm match={match} mine={mine} onSaved={(p) => onSaved(match.id, p)} /> : null}
      {open && started ? <RevealedPredictions match={match} others={others} users={users} meId={meId} /> : null}
      {open ? <MatchExtras matchId={match.id} homeApiName={match.home_team} awayApiName={match.away_team} started={started} /> : null}
    </article>
  );
}

// ===== Página =====
export default function Calendario() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('today');
  const [error, setError] = useState('');
  const [bet, setBet] = useState(null);

  async function load() {
    try {
      const d = await api('/api/matches');
      setData(d);
      const today = dayKey(new Date().toISOString());
      const hasToday = (d.matches || []).some((m) => dayKey(m.kickoff) === today);
      if (!hasToday) setFilter((f) => f === 'today' ? 'upcoming' : f);
    } catch (e) {
      if (e.message !== 'unauthorized') setError(e.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 90 * 1000);
    return () => clearInterval(t);
  }, []);

  const groups = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    const today = dayKey(new Date().toISOString());
    let list = data.matches || [];
    if (filter === 'today') list = list.filter((m) => dayKey(m.kickoff) === today);
    if (filter === 'upcoming') list = list.filter((m) => new Date(m.kickoff).getTime() > now);
    if (filter === 'finished') list = list.filter((m) => FINISHED.includes(m.status)).reverse();

    const map = new Map();
    for (const m of list) {
      const k = dayKey(m.kickoff);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    }
    return Array.from(map.entries());
  }, [data, filter]);

  function onSaved(matchId, pred) {
    setData((d) => ({ ...d, mine: { ...d.mine, [matchId]: { ...(d.mine[matchId] || {}), ...pred } } }));
  }

  if (error) return <main className="p-6 text-center pt-24 text-live">{error}</main>;
  if (!data) return <Spinner />;

  const empty = (data.matches || []).length === 0;
  const pendingToday = (data.matches || []).filter(
    (m) => dayKey(m.kickoff) === dayKey(new Date().toISOString()) &&
      new Date(m.kickoff).getTime() > Date.now() && !data.mine[m.id]
  ).length;

  return (
    <main className="pb-28 max-w-xl mx-auto">
      <header className="px-4 pt-12 pb-3 flex items-start justify-between">
        <div>
          <div className="eyebrow mb-1">La Porra · WC26</div>
          <h1 className="brand text-3xl">Partidos</h1>
          <p className="text-sm text-dim mt-1">
            {pendingToday > 0 ? `${pendingToday} partido${pendingToday > 1 ? 's' : ''} sin pronóstico hoy` : `Sesión · ${data.me.name}`}
          </p>
        </div>
        <Logout />
      </header>

      <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[['today', 'Hoy'], ['upcoming', 'Próximos'], ['finished', 'Jugados'], ['all', 'Todos'], ['groups', 'Grupos']].map(([v, l]) => (
          <button key={v} className={`chip shrink-0 ${filter === v ? 'chip-active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {filter === 'today' ? <TodaySummary data={data} /> : null}

      {filter === 'groups' ? (
        <GroupStandings matches={data.matches} />
      ) : empty ? (
        <div className="card m-4 p-6">
          <div className="eyebrow mb-2">SIN DATOS</div>
          <h2 className="display text-lg mb-2">No hay partidos cargados</h2>
          <p className="text-sm text-muted leading-relaxed">
            {data.apiConfigured
              ? 'Sincronizando con la API. Recarga en unos segundos o pide al admin que ejecute «Sync completo» en su panel.'
              : 'Falta configurar la API de fútbol. Pide al admin que la active en Vercel.'}
          </p>
        </div>
      ) : (
        <div className="px-4 mt-3">
          {groups.map(([day, matches]) => (
            <section key={day}>
              <div className="flex items-baseline justify-between mt-4 mb-2 px-1">
                <h2 className="eyebrow">{fmtDayLong(matches[0].kickoff)}</h2>
                {tournamentDay(matches[0].kickoff) ? (
                  <span className="font-display font-bold text-[10px] text-pitch tracking-widest">DÍA {tournamentDay(matches[0].kickoff)}</span>
                ) : null}
              </div>
              <div className="space-y-2.5">
                {matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    mine={data.mine[m.id]}
                    others={data.others[m.id]}
                    users={data.users}
                    meId={data.me.id}
                    onSaved={onSaved}
                    onOpenBet={(mm) => setBet(mm)}
                  />
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 ? <p className="text-center text-dim2 py-12 text-sm">Sin resultados con este filtro.</p> : null}
        </div>
      )}

      {bet ? (
        <BetSheet
          match={bet}
          mine={data.mine[bet.id]}
          onSaved={(p) => onSaved(bet.id, p)}
          onClose={() => setBet(null)}
        />
      ) : null}

      <BottomNav isAdmin={data.me.is_admin} />
    </main>
  );
}
