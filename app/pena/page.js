'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, BottomNav, Spinner, Avatar, Logout, Flag, fmtTime, fmtDayLong, dayKey, avatarColor } from '@/components/ui';
import { SHORT_LABEL } from '@/components/match';
import { teamName, stageES } from '@/lib/teams';
import { scorePrediction } from '@/lib/scoring';

const FINISHED = ['FT', 'AET', 'PEN'];

// ===== Mini-leaderboard arriba (sólo puntos de partidos visibles) =====
function MiniRanking({ users, matches, mine, others, meId }) {
  const totals = useMemo(() => {
    const acc = new Map();
    for (const u of users) acc.set(u.id, { id: u.id, name: u.name, pts: 0, exacts: 0, played: 0 });
    for (const m of matches) {
      if (m.home_goals == null || m.away_goals == null) continue;
      const list = [
        ...(meId && mine && mine[m.id] ? [{ ...mine[m.id], user_id: meId }] : []),
        ...((others && others[m.id]) || [])
      ];
      const seen = new Set();
      for (const p of list) {
        if (seen.has(p.user_id)) continue;
        seen.add(p.user_id);
        const u = acc.get(p.user_id);
        if (!u) continue;
        const { points } = scorePrediction(p, m);
        u.pts += points;
        u.played += 1;
        if (points >= 3) u.exacts += 1;
      }
    }
    return Array.from(acc.values()).sort((a, b) => b.pts - a.pts || b.exacts - a.exacts);
  }, [users, matches, mine, others, meId]);

  if (totals.length === 0) return null;
  const top = totals[0]?.pts || 0;

  return (
    <div className="grid grid-cols-4 gap-2 mt-5">
      {totals.map((u) => {
        const isMe = u.id === meId;
        const isLeader = u.pts === top && top > 0;
        return (
          <div key={u.id} className={`rounded-2xl text-center px-1.5 py-3 ${isMe ? 'bg-white/10' : 'bg-white/5'}`} style={{ backdropFilter: 'blur(8px)' }}>
            <span
              className="inline-flex items-center justify-center font-display font-black"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: avatarColor(u.name), color: '#0E1116', fontSize: 16,
                border: isLeader ? '2px solid #E0A400' : '0'
              }}
            >
              {(u.name?.[0] || '·').toUpperCase()}
            </span>
            <div className="text-[11px] text-white/80 font-bold mt-1.5 truncate px-1">{u.name}</div>
            <div className="font-display font-black text-pitch text-[15px] leading-none mt-0.5">{u.pts}<span className="text-[9px] text-white/50 font-display ml-0.5">pts</span></div>
          </div>
        );
      })}
    </div>
  );
}

// ===== Celda de una apuesta de un jugador para un partido =====
function BetCell({ user, pred, match, isMe, locked }) {
  if (locked) {
    return (
      <div className="rounded-xl bg-line2 px-2.5 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold text-dim2 truncate">{user.name}</span>
        </div>
        <div className="font-display font-black text-[15px] text-dim2 tracking-wide">🔒</div>
        <div className="text-[9px] text-dim2 mt-0.5">Tras el pitido</div>
      </div>
    );
  }
  if (!pred) {
    return (
      <div className="rounded-xl bg-line2 px-2.5 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span className="text-[10px] font-bold text-dim2 truncate">{user.name}</span>
        </div>
        <div className="font-display font-black text-[15px] text-dim2 tracking-wide">—</div>
        <div className="text-[9px] text-dim2 mt-0.5">Sin apuesta</div>
      </div>
    );
  }

  const realKnown = match.home_goals != null && match.away_goals != null;
  const live = realKnown ? scorePrediction(pred, match) : { points: 0, detail: [] };
  const done = FINISHED.includes(match.status);
  const exact = done && live.points >= 3;
  const miss = done && live.points === 0;

  const bg = isMe
    ? 'bg-pitch/10 border border-pitch/40'
    : exact ? 'bg-pitch/20 border border-pitch/30'
      : miss ? 'bg-line2 border border-line'
      : 'bg-white border border-line';

  return (
    <div className={`rounded-xl px-2.5 py-2 text-center ${bg}`}>
      <div className="flex items-center justify-center gap-1.5 mb-1 min-w-0">
        <span
          className="inline-flex items-center justify-center font-display font-black flex-shrink-0"
          style={{ width: 18, height: 18, borderRadius: '50%', background: avatarColor(user.name), color: '#0E1116', fontSize: 10 }}
        >
          {(user.name?.[0] || '·').toUpperCase()}
        </span>
        <span className="text-[10px] font-bold text-ink truncate">{user.name}{isMe ? ' (tú)' : ''}</span>
      </div>
      <div className="font-display font-black text-[17px] text-ink tracking-wide leading-none">
        {pred.home_goals}<span className="text-dim4 mx-0.5">–</span>{pred.away_goals}
      </div>
      {pred.corners != null || pred.more_cards ? (
        <div className="text-[9px] text-dim2 mt-1 flex items-center justify-center gap-1.5">
          {pred.corners != null ? <span>c{pred.corners}</span> : null}
          {pred.more_cards ? (
            <span className="flex items-center gap-0.5">
              +T
              {pred.more_cards === 'home' ? <Flag apiName={match.home_team} size="xs" /> :
               pred.more_cards === 'away' ? <Flag apiName={match.away_team} size="xs" /> : <span>=</span>}
            </span>
          ) : null}
        </div>
      ) : null}
      {realKnown && live.points > 0 ? (
        <div className="mt-1.5">
          <span className={exact ? 'badge-pts badge-exact' : 'badge-pts'}>
            {exact ? `CLAVADO +${live.points}` : `+${live.points}`}
          </span>
        </div>
      ) : null}
      {done && live.points === 0 ? (
        <div className="mt-1.5"><span className="badge-pts badge-miss">FALLO</span></div>
      ) : null}
    </div>
  );
}

// ===== Tarjeta de un partido + las 4 apuestas =====
function MatchRow({ match, users, mine, others, meId }) {
  const started = new Date(match.kickoff).getTime() <= Date.now();
  const live = match.status === 'LIVE' || match.status === 'HT';
  const done = FINISHED.includes(match.status);
  const realKnown = match.home_goals != null && match.away_goals != null;

  const allPredsMap = new Map();
  if (mine && mine[match.id]) allPredsMap.set(meId, { ...mine[match.id], user_id: meId });
  for (const p of (others && others[match.id]) || []) allPredsMap.set(p.user_id, p);

  return (
    <article className="card overflow-hidden">
      <header className="px-4 pt-3 pb-2 flex items-baseline justify-between">
        <span className="eyebrow">{stageES(match.stage)}</span>
        <span className="text-[11px] text-dim2 font-display font-bold">{fmtTime(match.kickoff)}</span>
      </header>
      <div className="px-4 pb-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Flag apiName={match.home_team} size="sm" shadow />
            <span className="font-display font-bold text-sm truncate">{teamName(match.home_team)}</span>
          </div>
          <div className="font-display font-black text-xl tracking-wide px-1 text-ink min-w-[58px] text-center">
            {realKnown ? <>{match.home_goals}<span className="text-dim4 mx-1">–</span>{match.away_goals}</> : <span className="text-sm text-dim4">vs</span>}
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-row-reverse text-right">
            <Flag apiName={match.away_team} size="sm" shadow />
            <span className="font-display font-bold text-sm truncate">{teamName(match.away_team)}</span>
          </div>
        </div>
        {live ? (
          <div className="flex justify-center mt-2"><span className="badge-live">EN VIVO</span></div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-1.5 px-3 pb-3 sm:grid-cols-4">
        {users.map((u) => {
          const isMe = u.id === meId;
          const pred = allPredsMap.get(u.id);
          const locked = !started && !isMe && !pred;
          // Si el partido NO ha empezado y soy yo, mi propia apuesta sí se ve.
          // Si NO he apostado aún, sale "Sin apuesta".
          // Si el partido NO ha empezado y NO soy yo, NO sabemos si apostó; ocultamos siempre.
          const hideOthers = !started && !isMe;
          return (
            <BetCell
              key={u.id}
              user={u}
              pred={hideOthers ? null : pred}
              match={match}
              isMe={isMe}
              locked={hideOthers}
            />
          );
        })}
      </div>
    </article>
  );
}

// ===== Página principal =====
export default function Pena() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('today');
  const [error, setError] = useState('');

  async function load() {
    try {
      const d = await api('/api/matches');
      setData(d);
      const today = dayKey(new Date().toISOString());
      const hasToday = (d.matches || []).some((m) => dayKey(m.kickoff) === today);
      if (!hasToday) setFilter((f) => f === 'today' ? 'finished' : f);
    } catch (e) {
      if (e.message !== 'unauthorized') setError(e.message);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 90 * 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const now = Date.now();
    const today = dayKey(new Date().toISOString());
    let list = data.matches || [];
    if (filter === 'today') list = list.filter((m) => dayKey(m.kickoff) === today);
    if (filter === 'upcoming') list = list.filter((m) => new Date(m.kickoff).getTime() > now);
    if (filter === 'finished') list = list.filter((m) => FINISHED.includes(m.status)).reverse();
    return list;
  }, [data, filter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const m of filtered) {
      const k = dayKey(m.kickoff);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(m);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (error) return <main className="p-6 text-center pt-24 text-live">{error}</main>;
  if (!data) return <Spinner />;

  return (
    <main className="pb-28 max-w-xl mx-auto">
      <section className="hero-night px-5 pt-12 pb-7">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="eyebrow text-white/55">Apuestas de la peña</div>
            <h1 className="brand text-2xl text-white mt-0.5">¿Qué jugó cada uno?</h1>
            <p className="text-[12px] text-white/55 mt-1">Las apuestas ajenas se desbloquean al sonar el pitido inicial.</p>
          </div>
          <Logout tone="dark" />
        </div>
        <MiniRanking
          users={data.users || []}
          matches={data.matches || []}
          mine={data.mine || {}}
          others={data.others || {}}
          meId={data.me?.id}
        />
      </section>

      <div className="flex gap-2 px-4 pt-4 overflow-x-auto no-scrollbar">
        {[['today', 'Hoy'], ['upcoming', 'Próximos'], ['finished', 'Jugados'], ['all', 'Todos']].map(([v, l]) => (
          <button key={v} className={`chip shrink-0 ${filter === v ? 'chip-active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div className="px-4 pt-3 space-y-5">
        {grouped.map(([day, matches]) => (
          <div key={day}>
            <div className="eyebrow mb-2 text-dim">{fmtDayLong(day)}</div>
            <div className="space-y-3">
              {matches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  users={data.users || []}
                  mine={data.mine}
                  others={data.others}
                  meId={data.me?.id}
                />
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 ? (
          <div className="card mt-3 p-6 text-center">
            <div className="eyebrow mb-2">SIN PARTIDOS</div>
            <p className="text-sm text-muted">No hay partidos en este filtro.</p>
          </div>
        ) : null}
      </div>

      <BottomNav isAdmin={data.me?.is_admin} />
    </main>
  );
}
