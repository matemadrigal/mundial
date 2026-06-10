'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, fmtTime, fmtDayLong, dayKey, tournamentDay, TopBar, BottomNav, Stepper, Spinner, Avatar, Logout } from '@/components/ui';
import { teamName, teamFlag, stageES } from '@/lib/teams';

const FINISHED = ['FT', 'AET', 'PEN'];

function Team({ name, align = 'left' }) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="text-xl shrink-0 leading-none">{teamFlag(name)}</span>
      <span className="font-semibold text-[15px] truncate">{teamName(name)}</span>
    </div>
  );
}

function CardsPick({ value, onChange, home, away }) {
  const opts = [
    { v: 'home', label: teamFlag(home), title: teamName(home) },
    { v: 'draw', label: '=', title: 'Empate' },
    { v: 'away', label: teamFlag(away), title: teamName(away) },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          title={o.title}
          className={`chip ${value === o.v ? 'chip-active' : ''}`}
          onClick={() => onChange(value === o.v ? null : o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PredictionForm({ match, mine, onSaved }) {
  const [hg, setHg] = useState(mine?.home_goals ?? null);
  const [ag, setAg] = useState(mine?.away_goals ?? null);
  const [corners, setCorners] = useState(mine?.corners ?? null);
  const [cards, setCards] = useState(mine?.more_cards ?? null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    if (hg == null || ag == null) { setMsg('Indica el resultado.'); return; }
    setSaving(true);
    setMsg('');
    try {
      await api('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({ match_id: match.id, home_goals: hg, away_goals: ag, corners, more_cards: cards }),
      });
      setMsg('Guardado.');
      onSaved({ home_goals: hg, away_goals: ag, corners, more_cards: cards });
    } catch (e) {
      setMsg(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-4">
      <div>
        <div className="eyebrow mb-2">Resultado</div>
        <div className="flex items-center justify-center gap-4">
          <Stepper value={hg} onChange={setHg} />
          <span className="mono text-lg text-dim">:</span>
          <Stepper value={ag} onChange={setAg} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Córners totales</span>
        <Stepper value={corners} onChange={setCorners} max={40} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Más tarjetas</span>
        <CardsPick value={cards} onChange={setCards} home={match.home_team} away={match.away_team} />
      </div>
      <button className="btn-gold w-full" onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : mine ? 'Actualizar pronóstico' : 'Confirmar pronóstico'}
      </button>
      {msg ? <p className="text-center text-sm text-muted">{msg}</p> : null}
      <p className="text-[11px] text-center text-dim">Editable hasta el inicio · {fmtTime(match.kickoff)}</p>
    </div>
  );
}

function RevealedPredictions({ match, others, users, meId }) {
  if (!others || others.length === 0) {
    return <p className="text-sm text-dim mt-3 text-center">Nadie envió pronóstico para este partido.</p>;
  }
  return (
    <div className="mt-4 pt-3 border-t border-line space-y-1.5">
      <div className="eyebrow mb-1.5">Pronósticos de la mesa</div>
      {others
        .slice()
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .map((p) => {
          const u = users.find((x) => x.id === p.user_id);
          const isMe = p.user_id === meId;
          return (
            <div key={p.user_id} className={`flex items-center justify-between text-sm rounded px-3 py-2 ${isMe ? 'bg-[#1c1c1c]' : ''}`}>
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
                {p.scored ? <span className="badge-pts">+{p.points}</span> : null}
              </span>
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

      {empty ? (
        <div className="ticket m-4 p-6">
          <div className="eyebrow mb-2">SIN DATOS</div>
          <h2 className="display text-lg mb-2">No hay partidos cargados</h2>
          <p className="text-sm text-muted leading-relaxed">
            {data.apiConfigured
              ? 'Sincronizando con API-Football. Recarga en unos segundos o pide al admin que ejecute «Sync completo» en su panel.'
              : 'Falta la API key de fútbol. Cuando el admin añada APIFOOTBALL_KEY en Vercel, el calendario se cargará automáticamente.'}
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
