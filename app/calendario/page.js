'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, fmtTime, fmtDayLong, dayKey, tournamentDay, TopBar, BottomNav, Spinner, Avatar, Logout } from '@/components/ui';
import { PredictionForm, SHORT_LABEL } from '@/components/match';
import { teamName, teamFlag, stageES } from '@/lib/teams';
import { scorePrediction } from '@/lib/scoring';

const FINISHED = ['FT', 'AET', 'PEN'];

function TodaySummary({ data }) {
  const today = dayKey(new Date().toISOString());
  const finishedToday = (data.matches || []).filter((m) =>
    dayKey(m.kickoff) === today && FINISHED.includes(m.status) && m.home_goals != null
  );
  if (finishedToday.length === 0) return null;

  // Suma de puntos por usuario en los partidos jugados hoy
  const totals = new Map();
  for (const u of data.users || []) totals.set(u.id, { user: u, pts: 0, hits: 0 });

  for (const m of finishedToday) {
    const preds = data.others[m.id] || [];
    for (const p of preds) {
      const r = scorePrediction(p, m);
      const row = totals.get(p.user_id);
      if (row) {
        row.pts += r.points;
        if (r.points > 0) row.hits++;
      }
    }
  }

  const rows = Array.from(totals.values()).sort((a, b) => b.pts - a.pts);

  return (
    <section className="ticket mx-4 mt-3 p-4">
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
            <div key={r.user.id} className={`text-center p-2 rounded ${isMe ? 'bg-[#1c1c1c]' : ''}`}>
              <div className="text-[10.5px] text-muted truncate">{r.user.name}</div>
              <div className={`score-digits text-xl leading-none mt-1 ${r.pts > 0 ? 'text-yellow' : 'text-dim'}`}>{r.pts > 0 ? `+${r.pts}` : '0'}</div>
              <div className="text-[9px] text-dim tracking-widest mt-1">{r.hits} ACIERTO{r.hits === 1 ? '' : 'S'}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Team({ name, align = 'left' }) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="text-xl shrink-0 leading-none">{teamFlag(name)}</span>
      <span className="font-semibold text-[15px] truncate">{teamName(name)}</span>
    </div>
  );
}

function RevealedPredictions({ match, others, users, meId }) {
  if (!others || others.length === 0) {
    return <p className="text-sm text-dim mt-3 text-center">Nadie envió pronóstico para este partido.</p>;
  }
  const realKnown = match.home_goals != null && match.away_goals != null;
  return (
    <div className="mt-4 pt-3 border-t border-line space-y-1.5">
      <div className="eyebrow mb-1.5">Pronósticos de la mesa</div>
      {others
        .slice()
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .map((p) => {
          const u = users.find((x) => x.id === p.user_id);
          const isMe = p.user_id === meId;
          const live = realKnown ? scorePrediction(p, match) : { points: 0, detail: [] };
          return (
            <div key={p.user_id} className={`rounded px-3 py-2 ${isMe ? 'bg-[#1c1c1c]' : ''}`}>
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={u?.name} me={isMe} />
                  <span className="font-semibold truncate">{u?.name}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span className="mono text-[15px] font-semibold">{p.home_goals}–{p.away_goals}</span>
                  {p.corners != null ? <span className="mono text-xs text-muted">c {p.corners}</span> : null}
                  {p.more_cards ? (
                    <span className="text-xs text-muted">
                      +T&nbsp;{p.more_cards === 'home' ? teamFlag(match.home_team) : p.more_cards === 'away' ? teamFlag(match.away_team) : '='}
                    </span>
                  ) : null}
                  {live.points > 0 ? <span className="badge-pts">+{live.points}</span> : null}
                </span>
              </div>
              {realKnown && live.detail.length > 0 ? (
                <div className="mt-1 ml-[38px] text-[10.5px] text-dim tracking-wide">
                  {live.detail.map((d, i) => (
                    <span key={i}>
                      {i > 0 ? <span className="opacity-50"> · </span> : null}
                      {SHORT_LABEL[d.label] || d.label} <span className="text-muted">+{d.pts}</span>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}

function StatusLabel({ match, live, done }) {
  if (live) return <span className="badge-live">{match.status === 'HT' ? 'DESCANSO' : 'EN VIVO'}</span>;
  if (done) return <span className="text-[11px] font-bold tracking-widest text-dim">FINAL</span>;
  return <span className="mono text-[13px] font-semibold text-ink">{fmtTime(match.kickoff)}</span>;
}

function MatchCard({ match, mine, others, users, meId, onSaved }) {
  const [open, setOpen] = useState(false);
  const started = new Date(match.kickoff).getTime() <= Date.now();
  const live = match.status === 'LIVE' || match.status === 'HT';
  const done = FINISHED.includes(match.status);
  const klass = live ? 'ticket ticket-live' : done ? 'ticket ticket-done' : 'ticket';

  return (
    <article className={`${klass} px-4 py-3.5`}>
      <button className="w-full text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="eyebrow">{stageES(match.stage)}</span>
          <StatusLabel match={match} live={live} done={done} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Team name={match.home_team} />
          {started || done ? (
            <div className="score-digits text-2xl px-2">
              {match.home_goals ?? 0}<span className="text-dim mx-1">–</span>{match.away_goals ?? 0}
            </div>
          ) : (
            <div className="mono text-sm text-dim px-2">vs</div>
          )}
          <Team name={match.away_team} align="right" />
        </div>

        <div className="flex items-center justify-between mt-2.5 gap-3 min-h-[18px]">
          <span className="text-[11px] text-dim truncate">{match.stadium || '—'}{match.city ? ` · ${match.city}` : ''}</span>
          <span className="shrink-0 flex items-center gap-2">
            {!started && (mine
              ? <span className="text-[11px] font-semibold text-ok mono">{mine.home_goals}-{mine.away_goals}</span>
              : <span className="text-[11px] font-bold text-yellow tracking-wider">PRONOSTICAR</span>)}
            {live && mine ? (() => {
              const s = scorePrediction(mine, match);
              return (
                <span className="text-[11px] mono font-semibold flex items-center gap-1.5">
                  <span className="text-dim">{mine.home_goals}-{mine.away_goals}</span>
                  {s.points > 0 ? <span className="badge-pts">+{s.points}</span> : <span className="text-dim">·</span>}
                </span>
              );
            })() : null}
            {done && mine?.scored ? <span className="badge-pts">+{mine.points}</span> : null}
            {done && match.stats_ready ? (
              <span className="text-[11px] text-dim mono">c{match.total_corners} · T{match.home_cards}-{match.away_cards}</span>
            ) : null}
          </span>
        </div>
      </button>

      {open && !started ? <PredictionForm match={match} mine={mine} onSaved={(p) => onSaved(match.id, p)} /> : null}
      {open && started ? <RevealedPredictions match={match} others={others} users={users} meId={meId} /> : null}
    </article>
  );
}

export default function Calendario() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('today');
  const [error, setError] = useState('');

  async function load() {
    try {
      const d = await api('/api/matches');
      setData(d);
      const today = dayKey(new Date().toISOString());
      const hasToday = (d.matches || []).some((m) => dayKey(m.kickoff) === today);
      if (!hasToday) setFilter('upcoming');
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
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar
        title="Calendario"
        sub={pendingToday > 0 ? `${pendingToday} partido${pendingToday > 1 ? 's' : ''} sin pronóstico hoy` : `Sesión: ${data.me.name}`}
        right={<Logout />}
      />

      <div className="px-4 pt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[['today', 'Hoy'], ['upcoming', 'Próximos'], ['finished', 'Jugados'], ['all', 'Todos']].map(([v, l]) => (
          <button key={v} className={`chip shrink-0 ${filter === v ? 'chip-active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {filter === 'today' ? <TodaySummary data={data} /> : null}

      {empty ? (
        <div className="ticket m-4 p-6">
          <div className="eyebrow mb-2">SIN DATOS</div>
          <h2 className="display text-lg mb-2">No hay partidos cargados</h2>
          <p className="text-sm text-muted leading-relaxed">
            {data.apiConfigured
              ? 'Sincronizando con la API de partidos. Recarga en unos segundos o pide al admin que ejecute «Sync completo» en su panel.'
              : 'Falta configurar la API de fútbol. Pide al admin que la active en Vercel.'}
          </p>
        </div>
      ) : (
        <div className="px-4">
          {groups.map(([day, matches]) => (
            <section key={day}>
              <div className="day-rule">
                <h2>{fmtDayLong(matches[0].kickoff)}</h2>
                {tournamentDay(matches[0].kickoff) ? (
                  <span className="mono text-[10px] text-yellow tracking-widest">DÍA {tournamentDay(matches[0].kickoff)}</span>
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
                  />
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 ? <p className="text-center text-dim py-12 text-sm">Sin resultados con este filtro.</p> : null}
        </div>
      )}

      <BottomNav isAdmin={data.me.is_admin} />
    </main>
  );
}
