'use client';
import { useEffect, useState } from 'react';
import { api, TopBar, BottomNav, Spinner, timeUntil, Avatar, Logout } from '@/components/ui';
import { teamName, teamFlag } from '@/lib/teams';
import { RULES } from '@/lib/scoring';

export default function Predicciones() {
  const [me, setMe] = useState(null);
  const [data, setData] = useState(null);
  const [champion, setChampion] = useState('');
  const [topScorer, setTopScorer] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const u = await api('/api/me');
    setMe(u.user);
    const d = await api('/api/global');
    setData(d);
    setChampion(d.mine?.champion || '');
    setTopScorer(d.mine?.top_scorer || '');
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      await api('/api/global', { method: 'POST', body: JSON.stringify({ champion, top_scorer: topScorer }) });
      setMsg('Apuestas globales registradas.');
    } catch (e) {
      setMsg(e.message);
    }
    setSaving(false);
  }

  if (!data || !me) return <Spinner />;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar title="Apuestas globales" sub="Cierran con el pitido inicial del torneo" right={<Logout />} />

      <div className="px-4 pt-3 space-y-4">
        <section className="ticket p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="eyebrow">Mercados</div>
              <h2 className="display text-lg mt-0.5">Pronósticos del torneo</h2>
            </div>
            {data.locked
              ? <span className="text-[11px] font-bold tracking-widest text-dim">CERRADAS</span>
              : data.lockAt
                ? <span className="text-[11px] font-bold text-live mono">CIERRA EN {timeUntil(new Date(data.lockAt).toISOString())?.toUpperCase() || '—'}</span>
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
                      <option key={t} value={t}>{teamFlag(t)} {teamName(t)}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" placeholder="Ej. España" value={champion} onChange={(e) => setChampion(e.target.value)} />
                )}
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <label className="eyebrow">Máximo goleador</label>
                  <span className="badge-pts">+5</span>
                </div>
                <input className="input" placeholder="Ej. Lamine Yamal" value={topScorer} onChange={(e) => setTopScorer(e.target.value)} />
              </div>
              <button className="btn-gold w-full" onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Confirmar apuestas'}
              </button>
              {msg ? <p className="text-center text-sm text-muted">{msg}</p> : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              {(data.everyone || []).map((g) => {
                const isMe = g.user_id === me.id;
                return (
                  <div key={g.user_id} className={`flex items-center justify-between text-sm rounded px-3 py-2.5 ${isMe ? 'bg-[#1c1c1c]' : ''}`}>
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={g.user?.name} me={isMe} />
                      <span className="font-semibold truncate">{g.user?.name}</span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block text-sm">{g.champion ? <>{teamFlag(g.champion)} {teamName(g.champion)}</> : '—'}</span>
                      <span className="block text-[11px] text-dim mono">P: {g.top_scorer || '—'}</span>
                    </span>
                  </div>
                );
              })}
              {data.result?.champion ? (
                <p className="text-center text-sm pt-3 mt-2 border-t border-line text-yellow font-bold">
                  Campeón oficial: {teamFlag(data.result.champion)} {teamName(data.result.champion)}
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="ticket p-5">
          <div className="eyebrow mb-1">Tarifa de premios</div>
          <h2 className="display text-lg mb-3">Sistema de puntuación</h2>
          <ul className="divide-y divide-line">
            {RULES.map((r) => (
              <li key={r.label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink">{r.label}</span>
                <span className="badge-pts">+{r.pts}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-dim mt-4 leading-relaxed">
            El resultado se evalúa al final del tiempo jugado (90&apos; o 120&apos;). Si hay penaltis,
            cuenta como empate para el 1X2. El exacto no suma además el 1X2. Tarjetas = amarillas + rojas por equipo.
          </p>
        </section>
      </div>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
