'use client';
import { useEffect, useState } from 'react';
import { api, TopBar, BottomNav, Spinner, timeUntil, fmtDayLong, fmtTime } from '@/components/ui';
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
      setMsg('Apuestas globales selladas ✓');
    } catch (e) {
      setMsg(e.message);
    }
    setSaving(false);
  }

  if (!data || !me) return <Spinner />;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar title="MIS APUESTAS" sub="Las grandes: se cierran con el pitido inaugural" />

      <div className="px-4 space-y-4">
        <section className="ticket p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="display text-base text-gold">APUESTAS GLOBALES</h2>
            {data.locked
              ? <span className="chip text-xs">🔒 Cerradas</span>
              : data.lockAt
                ? <span className="text-[11px] font-bold text-clay">⏳ Cierran en {timeUntil(new Date(data.lockAt).toISOString()) || 'nada'}</span>
                : null}
          </div>

          {!data.locked ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">🏆 Campeón del Mundial · 10 pts</label>
                {data.teams.length > 0 ? (
                  <select className="input" value={champion} onChange={(e) => setChampion(e.target.value)}>
                    <option value="">— Elige selección —</option>
                    {data.teams.map((t) => (
                      <option key={t} value={t}>{teamFlag(t)} {teamName(t)}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" placeholder="Escribe la selección (ej. España)" value={champion} onChange={(e) => setChampion(e.target.value)} />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">👟 Pichichi (máximo goleador) · 5 pts</label>
                <input className="input" placeholder="Ej. Lamine Yamal" value={topScorer} onChange={(e) => setTopScorer(e.target.value)} />
              </div>
              <button className="btn-gold w-full" onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Sellar apuestas globales 🎟️'}
              </button>
              {msg ? <p className="text-center text-sm text-sage">{msg}</p> : null}
            </div>
          ) : (
            <div className="space-y-2">
              {(data.everyone || []).map((g) => (
                <div key={g.user_id} className={`flex items-center justify-between text-sm rounded-lg px-3 py-2.5 ${g.user_id === me.id ? 'bg-white/10' : 'bg-white/[0.04]'}`}>
                  <span className="font-semibold">{g.user?.emoji} {g.user?.name}</span>
                  <span className="text-right">
                    <span className="block">{g.champion ? `${teamFlag(g.champion)} ${teamName(g.champion)}` : '—'}</span>
                    <span className="block text-xs opacity-60">👟 {g.top_scorer || '—'}</span>
                  </span>
                </div>
              ))}
              {data.result?.champion ? (
                <p className="text-center text-sm pt-2 text-gold font-bold">
                  Campeón real: {teamFlag(data.result.champion)} {teamName(data.result.champion)}
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section className="ticket p-5">
          <h2 className="display text-base text-gold mb-3">CÓMO SE PUNTÚA</h2>
          <ul className="space-y-2">
            {RULES.map((r) => (
              <li key={r.label} className="flex items-center justify-between text-sm">
                <span className="opacity-85">{r.label}</span>
                <span className="badge-pts">+{r.pts}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] opacity-45 mt-4 leading-relaxed">
            El resultado se evalúa al final del tiempo jugado (90&apos; o 120&apos;). Si hay penaltis,
            cuenta como empate para el 1X2. El exacto no suma además el 1X2. Tarjetas = amarillas + rojas por equipo.
          </p>
        </section>
      </div>

      <BottomNav isAdmin={me.is_admin} />
    </main>
  );
}
