'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, fmtTime, fmtDayLong, dayKey, tournamentDay, timeUntil, TopBar, BottomNav, Stepper, Spinner } from '@/components/ui';
import { teamName, teamFlag, stageES } from '@/lib/teams';

const FINISHED = ['FT', 'AET', 'PEN'];

function Team({ name, align = 'left' }) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className="text-2xl shrink-0">{teamFlag(name)}</span>
      <span className="font-semibold text-[15px] truncate">{teamName(name)}</span>
    </div>
  );
}

function CardsPick({ value, onChange, home, away }) {
  const opts = [
    { v: 'home', label: teamFlag(home) },
    { v: 'draw', label: '=' },
    { v: 'away', label: teamFlag(away) },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
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
    if (hg == null || ag == null) { setMsg('Pon el resultado al menos ⚽'); return; }
    setSaving(true);
    setMsg('');
    try {
      await api('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({ match_id: match.id, home_goals: hg, away_goals: ag, corners, more_cards: cards }),
      });
      setMsg('Guardada ✓');
      onSaved({ home_goals: hg, away_goals: ag, corners, more_cards: cards });
    } catch (e) {
      setMsg(e.message);
    }
    setSaving(false);
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Stepper value={hg} onChange={setHg} />
        <span className="display text-xl opacity-40">—</span>
        <Stepper value={ag} onChange={setAg} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Córners totales</span>
        <Stepper value={corners} onChange={setCorners} max={40} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Más tarjetas</span>
        <CardsPick value={cards} onChange={setCards} home={match.home_team} away={match.away_team} />
      </div>
      <button className="btn-gold w-full" onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : mine ? 'Actualizar predicción' : 'Sellar predicción 🎟️'}
      </button>
      {msg ? <p className="text-center text-sm text-sage">{msg}</p> : null}
      <p className="text-[11px] text-center opacity-40">Editable hasta el pitido inicial · {fmtTime(match.kickoff)}</p>
    </div>
  );
}

function RevealedPredictions({ match, others, users, meId }) {
  if (!others || others.length === 0) {
    return <p className="text-sm opacity-50 mt-3 text-center">Nadie selló predicción para este partido 🫥</p>;
  }
  return (
    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
      {others
        .slice()
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .map((p) => {
          const u = users.find((x) => x.id === p.user_id);
          return (
            <div key={p.user_id} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 ${p.user_id === meId ? 'bg-white/10' : 'bg-white/[0.04]'}`}>
              <span className="font-semibold">{u?.emoji} {u?.name}</span>
              <span className="flex items-center gap-3 opacity-90">
                <span className="score-digits">{p.home_goals}-{p.away_goals}</span>
                {p.corners != null ? <span className="opacity-60 text-xs">⛳{p.corners}</span> : null}
                {p.more_cards ? <span className="opacity-60 text-xs">🟨{p.more_cards === 'home' ? teamFlag(match.home_team) : p.more_cards === 'away' ? teamFlag(match.away_team) : '='}</span> : null}
                {p.scored ? <span className="badge-pts">+{p.points}</span> : null}
              </span>
            </div>
          );
        })}
    </div>
  );
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
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase opacity-60 mb-2.5 pl-2">
          <span>{stageES(match.stage)}</span>
          <span>
            {live ? <span className="badge-live">EN JUEGO</span> :
             done ? 'FINAL' :
             match.status === 'HT' ? 'DESCANSO' : fmtTime(match.kickoff) + ' h'}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pl-2">
          <Team name={match.home_team} />
          {started || done ? (
            <div className="score-digits text-2xl text-gold px-2">
              {match.home_goals ?? 0}–{match.away_goals ?? 0}
            </div>
          ) : (
            <div className="display text-sm opacity-30 px-2">VS</div>
          )}
          <Team name={match.away_team} align="right" />
        </div>

        <div className="flex items-center justify-between mt-2.5 pl-2">
          <span className="text-[11px] opacity-45">📍 {match.stadium || '—'}{match.city ? `, ${match.city}` : ''}</span>
          {!started && (mine
            ? <span className="text-[11px] font-bold text-sage">🎟️ {mine.home_goals}-{mine.away_goals} sellada</span>
            : <span className="text-[11px] font-bold text-gold">Sin predecir →</span>)}
          {done && mine?.scored ? <span className="badge-pts">+{mine.points}</span> : null}
          {done && match.stats_ready ? (
            <span className="text-[11px] opacity-45">⛳ {match.total_corners} · 🟨 {match.home_cards}-{match.away_cards}</span>
          ) : null}
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
    const t = setInterval(load, 90 * 1000); // refresco en vivo
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

  if (error) return <main className="p-6 text-center pt-24">{error}</main>;
  if (!data) return <Spinner />;

  const empty = (data.matches || []).length === 0;
  const pendingToday = (data.matches || []).filter(
    (m) => dayKey(m.kickoff) === dayKey(new Date().toISOString()) &&
      new Date(m.kickoff).getTime() > Date.now() && !data.mine[m.id]
  ).length;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar
        title="PARTIDOS"
        sub={pendingToday > 0 ? `⚡ Te quedan ${pendingToday} por predecir hoy` : `Hola, ${data.me.emoji} ${data.me.name}`}
      />

      <div className="px-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[['today', 'Hoy'], ['upcoming', 'Próximos'], ['finished', 'Jugados'], ['all', 'Todos']].map(([v, l]) => (
          <button key={v} className={`chip shrink-0 ${filter === v ? 'chip-active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {empty ? (
        <div className="ticket m-4 p-8 text-center">
          <div className="text-5xl mb-4">📡</div>
          <h2 className="display text-xl text-gold mb-2">SIN PARTIDOS AÚN</h2>
          <p className="text-sm opacity-70 leading-relaxed">
            {data.apiConfigured
              ? 'Sincronizando con API-Football… recarga en unos segundos o pide al admin que pulse «Sincronizar» en su panel.'
              : 'Falta la API key de fútbol. Cuando el admin añada APIFOOTBALL_KEY en Vercel, el calendario completo se cargará solo.'}
          </p>
        </div>
      ) : (
        <div className="px-4">
          {groups.map(([day, matches]) => (
            <section key={day}>
              <div className="day-rule">
                <h2 className="display text-sm text-chalk/90">{fmtDayLong(matches[0].kickoff)}</h2>
                {tournamentDay(matches[0].kickoff) ? (
                  <span className="text-[10px] font-bold tracking-widest text-gold/80">DÍA {tournamentDay(matches[0].kickoff)}</span>
                ) : null}
              </div>
              <div className="space-y-3">
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
          {groups.length === 0 ? <p className="text-center opacity-50 py-12 text-sm">Nada por aquí con este filtro 🤷</p> : null}
        </div>
      )}

      <BottomNav isAdmin={data.me.is_admin} />
    </main>
  );
}
