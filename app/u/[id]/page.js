'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, TopBar, BottomNav, Spinner, Avatar, Logout, fmtTime, fmtDayLong } from '@/components/ui';
import { SHORT_LABEL } from '@/components/match';
import { teamName, teamFlag, stageES } from '@/lib/teams';

function StatTile({ label, value, big }) {
  return (
    <div className="bg-surface2 border border-line rounded p-3">
      <div className="eyebrow">{label}</div>
      <div className={`mono font-bold leading-none mt-1.5 ${big ? 'text-2xl text-yellow' : 'text-lg text-ink'}`}>{value}</div>
    </div>
  );
}

function PickItem({ it }) {
  const { match: m, pred: p, points, detail } = it;
  const realKnown = m.home_goals != null && m.away_goals != null;
  return (
    <article className="ticket px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">{stageES(m.stage)} · {fmtTime(m.kickoff)}</span>
        {points > 0 ? <span className="badge-pts">+{points}</span> : realKnown ? <span className="text-[11px] text-dim tracking-widest">0 PTS</span> : null}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{teamFlag(m.home_team)}</span>
          <span className="text-sm font-semibold truncate">{teamName(m.home_team)}</span>
        </div>
        <span className="mono text-base font-semibold">
          {realKnown ? `${m.home_goals}–${m.away_goals}` : <span className="text-dim">vs</span>}
        </span>
        <div className="flex items-center gap-2 min-w-0 flex-row-reverse text-right">
          <span className="text-base">{teamFlag(m.away_team)}</span>
          <span className="text-sm font-semibold truncate">{teamName(m.away_team)}</span>
        </div>
      </div>
      <div className="mt-2 text-[12px] flex items-center justify-between">
        <span className="text-dim">
          Su pick: <span className="mono text-ink">{p.home_goals}-{p.away_goals}</span>
          {p.corners != null ? <> · <span className="mono">c{p.corners}</span></> : null}
          {p.more_cards ? <> · +T {p.more_cards === 'home' ? teamFlag(m.home_team) : p.more_cards === 'away' ? teamFlag(m.away_team) : '='}</> : null}
        </span>
      </div>
      {detail.length > 0 ? (
        <div className="mt-1 text-[10.5px] text-dim tracking-wide">
          {detail.map((d, i) => (
            <span key={i}>
              {i > 0 ? <span className="opacity-50"> · </span> : null}
              {SHORT_LABEL[d.label] || d.label} <span className="text-muted">+{d.pts}</span>
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function Profile() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const u = await api('/api/me');
        setMe(u.user);
        const d = await api(`/api/profile/${id}`);
        setData(d);
      } catch (e) {
        if (e.message !== 'unauthorized') setError(e.message);
      }
    })();
  }, [id]);

  if (error) return <main className="p-6 text-center pt-24 text-live">{error}</main>;
  if (!data || !me) return <Spinner />;

  const { target, stats, best, items } = data;
  const accuracy = stats.finishedAndScored > 0
    ? Math.round((items.filter((x) => x.points > 0).length / stats.finishedAndScored) * 100)
    : null;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar title="Perfil" sub={data.isMe ? 'Tu cuenta' : `Jugador #${target.id}`} right={<Logout />} />

      <div className="px-4 pt-3 space-y-4">
        <button onClick={() => router.push('/clasificacion')} className="text-[11px] text-dim hover:text-ink tracking-widest uppercase">
          ← Volver al ranking
        </button>

        <section className="ticket p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-surface2 border border-line flex items-center justify-center font-bold text-base">
              {target.name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <h2 className="display text-xl leading-tight">{target.name}</h2>
              <p className="text-xs text-dim mt-0.5">{data.isMe ? 'Eres tú' : 'Compañero de porra'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Puntos" value={stats.totalPts} big />
            <StatTile label="Acertados" value={`${items.filter((x) => x.points > 0).length}/${stats.finishedAndScored}`} />
            <StatTile label="% acierto" value={accuracy != null ? `${accuracy}%` : '—'} />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <StatTile label="Exactos" value={stats.exacts} />
            <StatTile label="1X2" value={stats.ones} />
            <StatTile label="+T" value={stats.cardsHit} />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <StatTile label="Córners exactos" value={stats.cornersExact} />
            <StatTile label="Córners ±2" value={stats.cornersClose} />
          </div>

          {stats.pending > 0 ? (
            <p className="text-[11px] text-dim mt-4 text-center">
              {stats.pending} pronóstico{stats.pending > 1 ? 's' : ''} pendiente{stats.pending > 1 ? 's' : ''} (ocultos hasta que empiece el partido).
            </p>
          ) : null}
        </section>

        {best ? (
          <section className="ticket p-5">
            <div className="eyebrow mb-2">Mejor partido</div>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {teamFlag(best.match.home_team)} {teamName(best.match.home_team)} <span className="text-dim mono mx-1">{best.match.home_goals}-{best.match.away_goals}</span> {teamName(best.match.away_team)} {teamFlag(best.match.away_team)}
              </div>
              <span className="badge-pts">+{best.points}</span>
            </div>
            <div className="text-[11px] text-dim mt-1">{fmtDayLong(best.match.kickoff)}</div>
          </section>
        ) : null}

        <section>
          <div className="day-rule"><h2>Historial</h2><span className="mono text-[10px] text-dim tracking-widest">{items.length}</span></div>
          {items.length === 0
            ? <p className="text-center text-dim text-sm py-8">Sin pronósticos revelados todavía.</p>
            : <div className="space-y-2">{items.map((it) => <PickItem key={it.match.id} it={it} />)}</div>}
        </section>
      </div>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
