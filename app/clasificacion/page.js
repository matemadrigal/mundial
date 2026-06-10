'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, BottomNav, Spinner, Avatar, Logout, avatarColor } from '@/components/ui';

export default function Clasificacion() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const u = await api('/api/me');
        setMe(u.user);
        const d = await api('/api/leaderboard');
        setRows(d.rows);
      } catch (e) {
        if (e.message !== 'unauthorized') setError(e.message);
      }
    })();
  }, []);

  if (error) return <main className="p-6 text-center pt-24 text-live">{error}</main>;
  if (!rows || !me) return <Spinner />;

  const leaderPts = rows[0]?.total || 0;
  const top3 = rows.slice(0, 3);

  // Orden podio (centro=1º, izda=2º, dcha=3º)
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const HEIGHTS = ['96px', '128px', '78px'];
  const RING = ['#cfd4db', '#E0A400', '#d8a06a'];
  const MEDAL = ['2', '1', '3'];

  return (
    <main className="pb-28 max-w-xl mx-auto">
      <section className="hero-night px-5 pt-12 pb-7">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="eyebrow text-white/55">Clasificación</div>
            <h1 className="brand text-2xl text-white mt-0.5">Ranking · La peña</h1>
            <p className="text-[12px] text-white/55 mt-1">El último paga las cañas de la final.</p>
          </div>
          <Logout tone="dark" />
        </div>

        {top3.length > 0 ? (
          <div className="flex items-end justify-center gap-2 mt-7">
            {podiumOrder.map((r, idx) => {
              const realRank = rows.indexOf(r);
              return (
                <div key={r.id} className="flex-1 text-center max-w-[120px]">
                  <span
                    className="inline-flex items-center justify-center font-display font-black"
                    style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: avatarColor(r.name), color: '#0E1116', fontSize: 24,
                      border: `2.5px solid ${RING[idx]}`
                    }}
                  >
                    {(r.name?.[0] || '·').toUpperCase()}
                  </span>
                  <div className="font-display font-bold text-white text-sm mt-2 truncate">{r.name}</div>
                  <div className="font-display font-black text-pitch text-xs">{r.total} pts</div>
                  <div
                    style={{
                      marginTop: 10,
                      height: HEIGHTS[idx],
                      background: idx === 1 ? 'rgba(255,205,70,.30)' : 'rgba(255,255,255,.07)',
                      borderRadius: '12px 12px 0 0',
                      display: 'flex',
                      justifyContent: 'center',
                      paddingTop: 12,
                      fontFamily: 'Archivo',
                      fontWeight: 900,
                      fontSize: 24,
                      color: idx === 1 ? '#FFD54A' : '#fff'
                    }}
                  >
                    {MEDAL[idx]}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <div className="px-4 pt-5 space-y-2">
        {rows.map((r, i) => {
          const isMe = r.id === me.id;
          const isLeader = i === 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => router.push(`/u/${r.id}`)}
              className={`card w-full text-left px-4 py-3.5 transition-colors hover:bg-line2 ${isMe ? '!border-pitch ring-1 ring-pitch/30' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`font-display font-black text-base w-7 text-center ${isLeader ? 'text-gold' : 'text-dim2'}`}>
                  {(i + 1)}º
                </div>
                <Avatar name={r.name} highlightMe={isMe} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate flex items-center gap-1.5">
                    {r.name}
                    {isMe ? <span className="text-dim2 text-xs font-normal">(tú)</span> : null}
                    <span className="text-dim2 text-[10px]">›</span>
                  </div>
                  <div className="text-[11px] text-dim2 mt-0.5">
                    {r.played} pron. puntuados · {r.exacts} clavados
                    {r.globalPoints > 0 ? ` · +${r.globalPoints} globales` : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display font-black text-2xl text-ink leading-none">{r.total}</div>
                  <div className="text-[10px] mt-1 font-display font-bold tracking-widest">
                    {isLeader
                      ? <span className="text-gold">LÍDER</span>
                      : <span className="text-dim2">−{leaderPts - r.total}</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-dim2 mt-6 px-6 leading-relaxed">
        Desempate: más resultados exactos. Los puntos de campeón y pichichi se aplican al cierre del torneo.
      </p>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
