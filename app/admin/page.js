'use client';
import { useEffect, useState } from 'react';
import { api, TopBar, BottomNav, Spinner, fmtTime, fmtDayLong } from '@/components/ui';
import { teamName, teamFlag } from '@/lib/teams';

function FixResult({ match, onDone }) {
  const [f, setF] = useState({
    home_goals: match.home_goals ?? 0,
    away_goals: match.away_goals ?? 0,
    total_corners: match.total_corners ?? '',
    home_cards: match.home_cards ?? '',
    away_cards: match.away_cards ?? '',
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setF((x) => ({ ...x, [k]: v })); }

  async function save() {
    setSaving(true);
    await api('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'set_result', match_id: match.id, ...f }) });
    setSaving(false);
    onDone();
  }

  const num = (k, ph) => (
    <input className="input !py-2 text-center" inputMode="numeric" placeholder={ph}
      value={f[k]} onChange={(e) => set(k, e.target.value.replace(/[^0-9]/g, ''))} />
  );

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[10px] opacity-60 uppercase">Goles {teamFlag(match.home_team)}</label>{num('home_goals', '0')}</div>
        <div><label className="text-[10px] opacity-60 uppercase">Goles {teamFlag(match.away_team)}</label>{num('away_goals', '0')}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-[10px] opacity-60 uppercase">Córners</label>{num('total_corners', '—')}</div>
        <div><label className="text-[10px] opacity-60 uppercase">🟨 {teamFlag(match.home_team)}</label>{num('home_cards', '—')}</div>
        <div><label className="text-[10px] opacity-60 uppercase">🟨 {teamFlag(match.away_team)}</label>{num('away_cards', '—')}</div>
      </div>
      <button className="btn-gold w-full !py-2.5" onClick={save} disabled={saving}>
        {saving ? '…' : 'Guardar resultado y recalcular puntos'}
      </button>
      {match.manual_override ? (
        <button className="btn-ghost w-full !py-2 text-xs" onClick={async () => {
          await api('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'release_override', match_id: match.id }) });
          onDone();
        }}>
          Devolver el control al sync automático
        </button>
      ) : null}
    </div>
  );
}

export default function Admin() {
  const [me, setMe] = useState(null);
  const [info, setInfo] = useState(null);
  const [matches, setMatches] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState('');
  const [log, setLog] = useState('');
  const [champ, setChamp] = useState('');
  const [scorer, setScorer] = useState('');

  async function load() {
    const u = await api('/api/me');
    if (!u.user.is_admin) { window.location.href = '/calendario'; return; }
    setMe(u.user);
    const a = await api('/api/admin');
    setInfo(a);
    setChamp(a.result?.champion || '');
    setScorer(a.result?.top_scorer || '');
    const m = await api('/api/matches');
    const now = Date.now();
    // Partidos de las últimas 48 h y próximas 24 h: los que puede tocar corregir
    setMatches((m.matches || []).filter((x) => {
      const t = new Date(x.kickoff).getTime();
      return t > now - 48 * 3600 * 1000 && t < now + 24 * 3600 * 1000;
    }));
  }

  useEffect(() => { load().catch(() => {}); }, []);

  async function sync(mode) {
    setBusy(mode);
    setLog('');
    try {
      const r = await api(`/api/sync?mode=${mode}&recalc=1`);
      setLog(r.ok ? `✓ Sync ${mode}: ${r.updated} partidos actualizados, ${r.statsFetched} con stats nuevas.` : `⚠️ ${r.reason}`);
      await load();
    } catch (e) {
      setLog('⚠️ ' + e.message);
    }
    setBusy('');
  }

  async function saveTournament() {
    await api('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'set_tournament_result', champion: champ, top_scorer: scorer }) });
    setLog('✓ Campeón/pichichi reales guardados. La clasificación ya los refleja.');
  }

  if (!me || !info) return <Spinner />;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar title="SALA VAR" sub="Panel del capitán de la porra" />

      <div className="px-4 space-y-4">
        <section className="ticket p-5">
          <h2 className="display text-base text-gold mb-3">SINCRONIZACIÓN</h2>
          <div className="text-sm space-y-1 mb-4 opacity-80">
            <p>Último sync: {info.lastSync ? `${fmtDayLong(info.lastSync.at)} · ${fmtTime(info.lastSync.at)} (${info.lastSync.mode})` : 'nunca'}</p>
            <p>Cuota API hoy: {info.quota ? `${info.quota.remaining}/${info.quota.limit} restantes` : 'sin datos aún'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-gold" onClick={() => sync('light')} disabled={!!busy}>
              {busy === 'light' ? 'Sincronizando…' : '⚡ Sync rápido'}
            </button>
            <button className="btn-ghost" onClick={() => sync('full')} disabled={!!busy}>
              {busy === 'full' ? '…' : '🌍 Sync completo'}
            </button>
          </div>
          {log ? <p className="text-sm mt-3 text-sage">{log}</p> : null}
          <p className="text-[11px] opacity-45 mt-3 leading-relaxed">
            El sync rápido corre solo cuando alguien usa la web en horario de partidos.
            El completo carga todo el torneo (úsalo la primera vez y cuando aparezcan cruces nuevos).
          </p>
        </section>

        <section className="ticket p-5">
          <h2 className="display text-base text-gold mb-3">CORREGIR PARTIDOS</h2>
          {matches.length === 0 ? <p className="text-sm opacity-60">No hay partidos en ventana de corrección (±48 h).</p> : null}
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="bg-white/[0.04] rounded-lg px-3 py-2.5">
                <button className="w-full flex items-center justify-between text-sm" onClick={() => setOpenId(openId === m.id ? null : m.id)}>
                  <span>{teamFlag(m.home_team)} {teamName(m.home_team)} – {teamName(m.away_team)} {teamFlag(m.away_team)}</span>
                  <span className="opacity-60 text-xs">{m.status}{m.manual_override ? ' ✍️' : ''}</span>
                </button>
                {openId === m.id ? <FixResult match={m} onDone={load} /> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="ticket p-5">
          <h2 className="display text-base text-gold mb-3">FINAL DEL TORNEO</h2>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] opacity-60 uppercase">Campeón real (nombre API, ej. Spain)</label>
              <input className="input" value={champ} onChange={(e) => setChamp(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] opacity-60 uppercase">Pichichi real</label>
              <input className="input" value={scorer} onChange={(e) => setScorer(e.target.value)} />
            </div>
            <button className="btn-ghost w-full" onClick={saveTournament}>Guardar y aplicar a la clasificación</button>
          </div>
        </section>
      </div>

      <BottomNav isAdmin />
    </main>
  );
}
