'use client';
import { useEffect, useState } from 'react';
import { api, TopBar, BottomNav, Spinner } from '@/components/ui';

const MEDALS = ['🥇', '🥈', '🥉', '🪵'];

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
      } catch (e) {}
    })();
  }, []);

  if (!rows || !me) return <Spinner />;

  const top = rows.slice(0, 3);
  const podiumOrder = [top[1], top[0], top[2]].filter(Boolean);
  const heights = { 0: 'h-20', 1: 'h-28', 2: 'h-16' };
  const leaderPts = rows[0]?.total || 0;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar title="CLASIFICACIÓN" sub="El que gana se lleva el bote 💰" />

      <div className="px-4">
        {/* Podio */}
        <div className="flex items-end justify-center gap-2 mt-4 mb-6">
          {podiumOrder.map((r) => {
            const realIdx = rows.indexOf(r);
            return (
              <div key={r.id} className="flex-1 max-w-[120px] text-center">
                <div className="text-3xl mb-1">{r.emoji}</div>
                <div className="text-xs font-bold truncate mb-1">{r.name}</div>
                <div className={`podium-step ${heights[podiumOrder.indexOf(r)] || 'h-16'}`}>
                  <span className="text-xl">{MEDALS[realIdx]}</span>
                  <span className="score-digits text-2xl text-gold">{r.total}</span>
                  <span className="text-[9px] uppercase tracking-widest opacity-50">pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabla completa */}
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={r.id} className={`ticket px-4 py-3 ${r.id === me.id ? 'outline outline-1 outline-gold/40' : ''}`}>
              <div className="flex items-center gap-3 pl-1">
                <span className="text-lg w-7">{MEDALS[i] || i + 1}</span>
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{r.name} {r.id === me.id ? <span className="opacity-50 text-xs">(tú)</span> : null}</div>
                  <div className="text-[11px] opacity-55">
                    {r.played} predicciones puntuadas · {r.exacts} exactos 🎯
                    {r.globalPoints > 0 ? ` · +${r.globalPoints} globales` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="score-digits text-2xl text-gold leading-none">{r.total}</div>
                  {i > 0 ? <div className="text-[10px] opacity-45 mt-0.5">a {leaderPts - r.total} del líder</div> : <div className="text-[10px] text-gold/80 mt-0.5 font-bold">LÍDER</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] opacity-40 mt-6 leading-relaxed">
          Desempate: más resultados exactos. Los puntos de campeón y pichichi
          entran cuando acabe el torneo.
        </p>
      </div>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
