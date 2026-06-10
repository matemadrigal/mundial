'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, BottomNav, Spinner, Avatar, Logout, Flag, fmtDayLong, avatarColor } from '@/components/ui';
import { SHORT_LABEL } from '@/components/match';
import { teamName, stageES } from '@/lib/teams';

function StatTile({ label, value, color }) {
  return (
    <div className="card-sm bg-white border border-line2 p-3 text-center">
      <div className="font-display font-black text-xl leading-none" style={{ color: color || '#0E1116' }}>{value}</div>
      <div className="eyebrow !text-[10px] mt-1.5">{label}</div>
    </div>
  );
}

function PickItem({ it }) {
  const { match: m, pred: p, points, detail } = it;
  const realKnown = m.home_goals != null && m.away_goals != null;
  return (
    <article className="card px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">{stageES(m.stage)} · {fmtDayLong(m.kickoff)}</span>
        {points > 0
          ? <span className={points >= 3 ? 'badge-pts badge-exact' : 'badge-pts'}>+{points}</span>
          : realKnown ? <span className="badge-pts badge-miss">FALLO</span> : null}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Flag apiName={m.home_team} size="sm" shadow />
          <span className="font-display font-bold text-sm truncate">{teamName(m.home_team)}</span>
        </div>
        <span className="font-display font-black text-base">
          {realKnown ? `${m.home_goals}–${m.away_goals}` : <span className="text-dim2">vs</span>}
        </span>
        <div className="flex items-center gap-2 min-w-0 flex-row-reverse text-right">
          <Flag apiName={m.away_team} size="sm" shadow />
          <span className="font-display font-bold text-sm truncate">{teamName(m.away_team)}</span>
        </div>
      </div>
      <div className="mt-2 text-[12px] flex items-center justify-between border-t border-line2 pt-2">
        <span className="text-dim">
          Pick: <span className="font-display font-bold text-ink">{p.home_goals}-{p.away_goals}</span>
          {p.corners != null ? <> · <span className="font-display">c{p.corners}</span></> : null}
          {p.more_cards ? <> · +T {p.more_cards === 'home' ? <Flag apiName={m.home_team} size="xs" /> : p.more_cards === 'away' ? <Flag apiName={m.away_team} size="xs" /> : '='}</> : null}
        </span>
      </div>
      {detail.length > 0 ? (
        <div className="mt-1 text-[10.5px] text-dim2 tracking-wide">
          {detail.map((d, i) => (
            <span key={i}>
              {i > 0 ? <span className="opacity-50"> · </span> : null}
              {SHORT_LABEL[d.label] || d.label} <span className="text-pitch-soft-ink font-bold">+{d.pts}</span>
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
    <main className="pb-28 max-w-xl mx-auto">
      <section className="hero-night px-5 pt-12 pb-7">
        <div className="flex items-start justify-between mb-4">
          <button
            onClick={() => router.push('/clasificacion')}
            className="text-[11px] text-white/70 tracking-widest uppercase font-bold"
          >
            ← Volver al ranking
          </button>
          <Logout tone="dark" />
        </div>

        <div className="flex items-center gap-4">
          <span
            className="inline-flex items-center justify-center font-display font-black"
            style={{ width: 72, height: 72, borderRadius: '50%', background: avatarColor(target.name), color: '#0E1116', fontSize: 30 }}
          >
            {(target.name?.[0] || '·').toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="brand text-2xl text-white truncate">{target.name}{data.isMe ? <span className="text-white/60 text-base font-bold ml-2">· tú</span> : null}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[12px] font-display font-bold text-pitchInk bg-pitch px-2 py-0.5 rounded-md">{stats.totalPts} pts</span>
              <span className="text-[12px] text-white/55">{stats.predicted} pron. revelados</span>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <StatTile label="Puntos" value={stats.totalPts} color="#06914B" />
          <StatTile label="Aciertos" value={`${items.filter((x) => x.points > 0).length}/${stats.finishedAndScored}`} />
          <StatTile label="Clavados" value={stats.exacts} color="#E0A400" />
          <StatTile label="% Acierto" value={accuracy != null ? `${accuracy}%` : '—'} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatTile label="1X2" value={stats.ones} />
          <StatTile label="Tarjetas" value={stats.cardsHit} />
          <StatTile label="Córners" value={stats.cornersExact + stats.cornersClose} />
        </div>

        {best ? (
          <section className="card p-4">
            <div className="eyebrow mb-2">Mejor partido</div>
            <div className="flex items-center justify-between">
              <div className="text-sm flex items-center gap-2 min-w-0">
                <Flag apiName={best.match.home_team} size="xs" />
                <span className="font-display font-bold truncate">{teamName(best.match.home_team)}</span>
                <span className="font-display text-dim mono">{best.match.home_goals}-{best.match.away_goals}</span>
                <span className="font-display font-bold truncate">{teamName(best.match.away_team)}</span>
                <Flag apiName={best.match.away_team} size="xs" />
              </div>
              <span className={best.points >= 3 ? 'badge-pts badge-exact' : 'badge-pts'}>+{best.points}</span>
            </div>
            <div className="text-[11px] text-dim2 mt-1">{fmtDayLong(best.match.kickoff)}</div>
          </section>
        ) : null}

        {stats.pending > 0 ? (
          <p className="text-[11px] text-dim2 text-center">
            {stats.pending} pronóstico{stats.pending > 1 ? 's' : ''} pendiente{stats.pending > 1 ? 's' : ''} (ocultos hasta que empiece el partido).
          </p>
        ) : null}

        <section>
          <div className="flex items-baseline justify-between px-1 mb-2">
            <h2 className="eyebrow">Historial</h2>
            <span className="font-display font-bold text-[10px] text-dim2 tracking-widest">{items.length}</span>
          </div>
          {items.length === 0
            ? <p className="text-center text-dim2 text-sm py-8">Sin pronósticos revelados todavía.</p>
            : <div className="space-y-2">{items.map((it) => <PickItem key={it.match.id} it={it} />)}</div>}
        </section>
      </div>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
