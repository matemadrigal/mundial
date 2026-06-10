'use client';
import { useEffect, useState } from 'react';
import { api, TopBar, BottomNav, Spinner, Avatar, Logout } from '@/components/ui';

export default function Clasificacion() {
  const [me, setMe] = useState(null);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await api('/api/me');
        setMe(u.user);
        const d = await api('/api/leaderboard');
        setRows(d.rows);
      } catch {}
    })();
  }, []);

  if (!rows || !me) return <Spinner />;

  const leaderPts = rows[0]?.total || 0;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar title="Clasificación" sub="El ganador se lleva el bote" right={<Logout />} />

      <div className="px-4 pt-3 space-y-2">
        {rows.map((r, i) => {
          const isMe = r.id === me.id;
          const isLeader = i === 0;
          return (
            <div
              key={r.id}
              className={`ticket px-4 py-3 ${isMe ? '!border-yellow' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`mono text-base font-bold w-7 text-center ${isLeader ? 'text-yellow' : 'text-dim'}`}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <Avatar name={r.name} me={isMe} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">
                    {r.name}
                    {isMe ? <span className="text-dim text-xs font-normal ml-1.5">(tú)</span> : null}
                  </div>
                  <div className="text-[11px] text-dim mt-0.5">
                    {r.played} pron. puntuados · {r.exacts} exactos
                    {r.globalPoints > 0 ? ` · +${r.globalPoints} globales` : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="score-digits text-2xl text-ink leading-none">{r.total}</div>
                  <div className="text-[10px] mt-1">
                    {isLeader
                      ? <span className="text-yellow font-bold tracking-widest">LÍDER</span>
                      : <span className="text-dim mono">−{leaderPts - r.total} pts</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-dim mt-6 px-6 leading-relaxed">
        Desempate: más resultados exactos. Los puntos de campeón y pichichi se aplican al cierre del torneo.
      </p>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
