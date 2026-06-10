'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, BottomNav, Spinner, Avatar, Logout, Flag, timeUntil, fmtTime, dayKey } from '@/components/ui';
import { PredictionForm, SHORT_LABEL } from '@/components/match';
import { teamName, stageES } from '@/lib/teams';
import { RULES, scorePrediction } from '@/lib/scoring';

const FINISHED = ['FT', 'AET', 'PEN'];

function MyPickRow({ match, mine, onSaved }) {
  const [open, setOpen] = useState(false);
  const started = new Date(match.kickoff).getTime() <= Date.now();
  const live = match.status === 'LIVE' || match.status === 'HT';
  const done = FINISHED.includes(match.status);
  const result = match.home_goals != null && match.away_goals != null
    ? `${match.home_goals}–${match.away_goals}` : null;
  const live_eval = (started && mine && result) ? scorePrediction(mine, match) : null;

  return (
    <article className={`card px-4 py-3 ${live ? 'ticket-live' : ''} ${done ? 'ticket-done' : ''}`}>
      <button className="w-full text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="flex items-center justify-between mb-2">
          <span className="eyebrow">{stageES(match.stage)} · {fmtTime(match.kickoff)}</span>
          {live ? <span className="badge-live">{match.status === 'HT' ? 'DESCANSO' : 'EN VIVO'}</span>
            : done ? <span className="text-[11px] font-display font-bold tracking-widest text-dim2">FINAL</span>
            : <span className="text-[11px] font-display font-bold text-pitch-soft-ink tracking-widest">{mine ? 'PENDIENTE' : 'POR PREDECIR'}</span>}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 min-w-0">
            <Flag apiName={match.home_team} size="sm" shadow />
            <span className="font-display font-bold text-sm truncate">{teamName(match.home_team)}</span>
          </span>
          <span className="font-display font-black text-base shrink-0">
            {result || <span className="text-dim2 font-normal">vs</span>}
          </span>
          <span className="flex items-center gap-2 min-w-0 flex-row-reverse text-right">
            <Flag apiName={match.away_team} size="sm" shadow />
            <span className="font-display font-bold text-sm truncate">{teamName(match.away_team)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between mt-2.5 text-[12px] pt-2.5 border-t border-line2">
          <span className="text-dim">
            {mine
              ? <>Tu pick: <span className="font-display font-bold text-ink">{mine.home_goals}-{mine.away_goals}</span>
                  {mine.corners != null ? <> · <span className="font-display">c{mine.corners}</span></> : null}
                  {mine.more_cards ? <> · +T {mine.more_cards === 'home' ? <Flag apiName={match.home_team} size="xs" /> : mine.more_cards === 'away' ? <Flag apiName={match.away_team} size="xs" /> : '='}</> : null}
                </>
              : <span className="text-pitch-soft-ink font-bold tracking-wider">SIN PRONÓSTICO</span>}
          </span>
          {live_eval && live_eval.points > 0 ? <span className="badge-pts">+{live_eval.points}</span> : null}
        </div>

        {done && live_eval && live_eval.detail.length > 0 ? (
          <div className="mt-1 text-[10.5px] text-dim2 tracking-wide">
            {live_eval.detail.map((d, i) => (
              <span key={i}>
                {i > 0 ? <span className="opacity-50"> · </span> : null}
                {SHORT_LABEL[d.label] || d.label} <span className="text-pitch-soft-ink font-bold">+{d.pts}</span>
              </span>
            ))}
          </div>
        ) : null}
      </button>

      {open && !started ? (
        <PredictionForm match={match} mine={mine} onSaved={(p) => { onSaved(match.id, p); setOpen(false); }} />
      ) : null}
    </article>
  );
}

function MisPartidos({ data, onSaved }) {
  const todayKey = dayKey(new Date().toISOString());

  const { pendingToday, upcoming, played, totals } = useMemo(() => {
    const all = data.matches || [];
    const now = Date.now();
    const pendingToday = [];
    const upcoming = [];
    const played = [];
    let totalPts = 0, exacts = 0, ones = 0, predicted = 0, hits = 0;

    for (const m of all) {
      const t = new Date(m.kickoff).getTime();
      const mine = data.mine[m.id];
      const started = t <= now;
      const isToday = dayKey(m.kickoff) === todayKey;
      const finished = FINISHED.includes(m.status);

      if (mine) predicted++;

      if (started && mine) {
        played.push(m);
        if (finished && m.home_goals != null) {
          const r = scorePrediction(mine, m);
          totalPts += r.points;
          if (r.points > 0) hits++;
          if (mine.home_goals === m.home_goals && mine.away_goals === m.away_goals) exacts++;
          else if (r.detail.find((d) => d.label === '1X2')) ones++;
        }
      } else if (!started) {
        if (isToday && !mine) pendingToday.push(m);
        else if (mine) upcoming.push(m);
        else if (!isToday) upcoming.push(m);
      }
    }
    pendingToday.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    upcoming.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    played.sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff));
    return { pendingToday, upcoming, played, totals: { totalPts, exacts, ones, predicted, hits } };
  }, [data, todayKey]);

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <div className="eyebrow mb-2">Tu balance</div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <Stat label="Puntos" value={totals.totalPts} big />
          <Stat label="Clavados" value={totals.exacts} />
          <Stat label="1X2" value={totals.ones} />
          <Stat label="Aciertos" value={`${totals.hits}/${totals.predicted}`} />
        </div>
      </section>

      {pendingToday.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="eyebrow">Hoy · sin pronóstico</h2>
            <span className="font-display font-bold text-[10px] text-live tracking-widest">URGENTE</span>
          </div>
          {pendingToday.map((m) => <MyPickRow key={m.id} match={m} mine={null} onSaved={onSaved} />)}
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="space-y-2">
          <div className="eyebrow px-1">Próximos</div>
          {upcoming.map((m) => <MyPickRow key={m.id} match={m} mine={data.mine[m.id]} onSaved={onSaved} />)}
        </section>
      ) : null}

      {played.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="eyebrow">Ya jugados</h2>
            <span className="font-display font-bold text-[10px] text-dim2 tracking-widest">{played.length}</span>
          </div>
          {played.map((m) => <MyPickRow key={m.id} match={m} mine={data.mine[m.id]} onSaved={onSaved} />)}
        </section>
      ) : null}

      {pendingToday.length === 0 && upcoming.length === 0 && played.length === 0 ? (
        <p className="text-center text-dim2 text-sm py-12">No hay partidos cargados todavía.</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, big }) {
  return (
    <div>
      <div className={`font-display font-black leading-none ${big ? 'text-2xl text-pitch-soft-ink' : 'text-xl text-ink'}`}>{value}</div>
      <div className="eyebrow !text-[10px] mt-1">{label}</div>
    </div>
  );
}

function Globales({ me, data, onSaveGlobals }) {
  const [champion, setChampion] = useState(data.mine?.champion || '');
  const [topScorer, setTopScorer] = useState(data.mine?.top_scorer || '');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setMsg(''); setOk(false);
    try {
      await api('/api/global', { method: 'POST', body: JSON.stringify({ champion, top_scorer: topScorer }) });
      setMsg('Apuestas globales registradas.'); setOk(true);
      onSaveGlobals && onSaveGlobals();
    } catch (e) { setMsg(e.message); setOk(false); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow">Mercados</div>
            <h2 className="display text-lg mt-0.5">Apuestas del torneo</h2>
          </div>
          {data.locked
            ? <span className="text-[11px] font-display font-bold tracking-widest text-dim2">CERRADAS</span>
            : data.lockAt
              ? <span className="text-[11px] font-display font-bold text-live tracking-widest">CIERRA EN {timeUntil(new Date(data.lockAt).toISOString())?.toUpperCase() || '—'}</span>
              : null}
        </div>

        {!data.locked ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="eyebrow">Campeón del Mundial</label>
                <span className="badge-pts">+10</span>
              </div>
              {data.teams.length > 0 ? (
                <select className="input" value={champion} onChange={(e) => setChampion(e.target.value)}>
                  <option value="">— Selecciona equipo —</option>
                  {data.teams.map((t) => (
                    <option key={t} value={t}>{teamName(t)}</option>
                  ))}
                </select>
              ) : (
                <input className="input" placeholder="Ej. España" value={champion} onChange={(e) => setChampion(e.target.value)} />
              )}
              {champion ? (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <Flag apiName={champion} size="sm" shadow />
                  <span className="font-display font-bold">{teamName(champion)}</span>
                </div>
              ) : null}
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="eyebrow">Máximo goleador</label>
                <span className="badge-pts">+5</span>
              </div>
              <input className="input" placeholder="Ej. Lamine Yamal" value={topScorer} onChange={(e) => setTopScorer(e.target.value)} />
            </div>
            <button className="btn-pitch w-full" onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : 'Confirmar apuestas'}
            </button>
            {msg ? <p className={`text-center text-sm ${ok ? 'text-pitch-soft-ink' : 'text-live'}`}>{msg}</p> : null}
          </div>
        ) : (
          <div className="space-y-1.5">
            {(data.everyone || []).map((g) => {
              const isMe = g.user_id === me.id;
              return (
                <div key={g.user_id} className={`flex items-center justify-between text-sm rounded-2xl px-3 py-2.5 ${isMe ? 'bg-pitchHi' : ''}`}>
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={g.user?.name} highlightMe={isMe} />
                    <span className="font-semibold truncate">{g.user?.name}</span>
                  </span>
                  <span className="text-right shrink-0 flex items-center gap-2">
                    <span className="block text-sm flex items-center gap-1.5">
                      {g.champion ? <><Flag apiName={g.champion} size="xs" /> {teamName(g.champion)}</> : '—'}
                    </span>
                    <span className="block text-[11px] text-dim2 font-display">P: {g.top_scorer || '—'}</span>
                  </span>
                </div>
              );
            })}
            {data.result?.champion ? (
              <p className="text-center text-sm pt-3 mt-2 border-t border-line text-pitch-soft-ink font-bold">
                Campeón oficial: <Flag apiName={data.result.champion} size="xs" /> {teamName(data.result.champion)}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="eyebrow mb-1">Tarifa de premios</div>
        <h2 className="display text-lg mb-3">Sistema de puntuación</h2>
        <ul className="divide-y divide-line2">
          {RULES.map((r) => (
            <li key={r.label} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink">{r.label}</span>
              <span className="badge-pts">+{r.pts}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-dim2 mt-4 leading-relaxed">
          El resultado se evalúa al final del tiempo jugado (90&apos; o 120&apos;). Si hay penaltis,
          cuenta como empate para el 1X2. El exacto no suma además el 1X2. Tarjetas = amarillas + rojas por equipo.
        </p>
      </section>
    </div>
  );
}

export default function Predicciones() {
  const [tab, setTab] = useState('mis');
  const [me, setMe] = useState(null);
  const [matches, setMatches] = useState(null);
  const [global, setGlobal] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const u = await api('/api/me');
      setMe(u.user);
      const [m, g] = await Promise.all([api('/api/matches'), api('/api/global')]);
      setMatches(m);
      setGlobal(g);
    } catch (e) {
      if (e.message !== 'unauthorized') setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  function onSavedMyPick(matchId, pred) {
    setMatches((d) => ({ ...d, mine: { ...d.mine, [matchId]: { ...(d.mine[matchId] || {}), ...pred } } }));
  }

  if (error) return <main className="p-6 text-center pt-24 text-live">{error}</main>;
  if (!me || !matches || !global) return <Spinner />;

  return (
    <main className="pb-28 max-w-xl mx-auto">
      <header className="px-4 pt-12 pb-3 flex items-start justify-between">
        <div>
          <div className="eyebrow mb-1">Apuestas</div>
          <h1 className="brand text-3xl">Mis predicciones</h1>
          <p className="text-sm text-dim mt-1">Editable hasta el inicio de cada partido.</p>
        </div>
        <Logout />
      </header>

      <div className="px-4 pt-3 flex gap-2">
        <button className={`chip flex-1 justify-center ${tab === 'mis' ? 'chip-active' : ''}`} onClick={() => setTab('mis')}>
          Mis partidos
        </button>
        <button className={`chip flex-1 justify-center ${tab === 'globales' ? 'chip-active' : ''}`} onClick={() => setTab('globales')}>
          Globales
        </button>
      </div>

      <div className="px-4 pt-4">
        {tab === 'mis'
          ? <MisPartidos data={matches} onSaved={onSavedMyPick} />
          : <Globales me={me} data={global} onSaveGlobals={load} />}
      </div>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
