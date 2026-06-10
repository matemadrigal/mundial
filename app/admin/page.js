'use client';
import { useEffect, useState } from 'react';
import { api, TopBar, BottomNav, Spinner, fmtTime, fmtDayLong, Logout } from '@/components/ui';
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
    <input className="input mono !py-2 text-center" inputMode="numeric" placeholder={ph}
      value={f[k]} onChange={(e) => set(k, e.target.value.replace(/[^0-9]/g, ''))} />
  );

  return (
    <div className="mt-3 pt-3 border-t border-line space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="eyebrow block mb-1">Goles {teamFlag(match.home_team)}</label>
          {num('home_goals', '0')}
        </div>
        <div>
          <label className="eyebrow block mb-1">Goles {teamFlag(match.away_team)}</label>
          {num('away_goals', '0')}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="eyebrow block mb-1">Córners</label>
          {num('total_corners', '—')}
        </div>
        <div>
          <label className="eyebrow block mb-1">T. {teamFlag(match.home_team)}</label>
          {num('home_cards', '—')}
        </div>
        <div>
          <label className="eyebrow block mb-1">T. {teamFlag(match.away_team)}</label>
          {num('away_cards', '—')}
        </div>
      </div>
      <button className="btn-gold w-full !py-2.5" onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar y recalcular puntos'}
      </button>
      {match.manual_override ? (
        <button className="btn-ghost w-full !py-2 !text-[11px]" onClick={async () => {
          await api('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'release_override', match_id: match.id }) });
          onDone();
        }}>
          Devolver control al sync automático
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
  const [logTone, setLogTone] = useState('ok');
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
      if (r.ok) {
        setLog(`Sync ${mode}: ${r.updated} partidos actualizados, ${r.statsFetched} con stats nuevas.`);
        setLogTone('ok');
      } else {
        setLog(r.reason);
        setLogTone('warn');
      }
      await load();
    } catch (e) {
      setLog(e.message);
      setLogTone('warn');
    }
    setBusy('');
  }

  async function saveTournament() {
    await api('/api/admin', { method: 'POST', body: JSON.stringify({ action: 'set_tournament_result', champion: champ, top_scorer: scorer }) });
    setLog('Campeón y pichichi reales guardados. La clasificación se ha actualizado.');
    setLogTone('ok');
  }

  if (!me || !info) return <Spinner />;

  return (
    <main className="pb-24 max-w-xl mx-auto">
      <TopBar title="Panel admin" sub={`Operador: ${me.name}`} right={<Logout />} />

      <div className="px-4 pt-3 space-y-4">
        <section className="ticket p-5">
          <div className="eyebrow mb-1">Sistema</div>
          <h2 className="display text-lg mb-3">Sincronización</h2>
          <dl className="text-sm space-y-1.5 mb-4">
            <div className="flex justify-between"><dt className="text-dim">Último sync</dt><dd className="mono text-right">{info.lastSync ? `${fmtDayLong(info.lastSync.at)} ${fmtTime(info.lastSync.at)} (${info.lastSync.mode})` : 'nunca'}</dd></div>
            <div className="flex justify-between"><dt className="text-dim">Cuota API hoy</dt><dd className="mono text-right">{info.quota ? `${info.quota.remaining}/${info.quota.limit}` : '—'}</dd></div>
          </dl>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-gold !py-2.5" onClick={() => sync('light')} disabled={!!busy}>
              {busy === 'light' ? 'Sync…' : 'Sync rápido'}
            </button>
            <button className="btn-ghost !py-2.5" onClick={() => sync('full')} disabled={!!busy}>
              {busy === 'full' ? '…' : 'Sync completo'}
            </button>
          </div>
          {log ? <p className={`text-sm mt-3 ${logTone === 'ok' ? 'text-ok' : 'text-live'}`}>{log}</p> : null}
          <p className="text-[11px] text-dim mt-3 leading-relaxed">
            El sync rápido se ejecuta automáticamente cuando alguien navega la web durante el horario de partidos.
            Usa el completo en la primera carga y cuando aparezcan nuevos cruces de eliminatoria.
          </p>
        </section>

        <section className="ticket p-5">
          <div className="eyebrow mb-1">Operaciones manuales</div>
          <h2 className="display text-lg mb-3">Corregir partido</h2>
          {matches.length === 0 ? (
            <p className="text-sm text-dim">No hay partidos en ventana de corrección (±48 h).</p>
          ) : (
            <div className="space-y-1.5">
              {matches.map((m) => (
                <div key={m.id} className="bg-surface2 rounded px-3 py-2.5">
                  <button className="w-full flex items-center justify-between text-sm gap-2" onClick={() => setOpenId(openId === m.id ? null : m.id)}>
                    <span className="truncate">{teamFlag(m.home_team)} {teamName(m.home_team)} — {teamName(m.away_team)} {teamFlag(m.away_team)}</span>
                    <span className="mono text-[11px] text-dim shrink-0">{m.status}{m.manual_override ? ' · MANUAL' : ''}</span>
                  </button>
                  {openId === m.id ? <FixResult match={m} onDone={load} /> : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ticket p-5">
          <div className="eyebrow mb-1">Cierre</div>
          <h2 className="display text-lg mb-3">Final del torneo</h2>
          <div className="space-y-3">
            <div>
              <label className="eyebrow block mb-1">Campeón (nombre API, ej. Spain)</label>
              <input className="input" value={champ} onChange={(e) => setChamp(e.target.value)} />
            </div>
            <div>
              <label className="eyebrow block mb-1">Pichichi</label>
              <input className="input" value={scorer} onChange={(e) => setScorer(e.target.value)} />
            </div>
            <button className="btn-ghost w-full" onClick={saveTournament}>Guardar y aplicar al ranking</button>
          </div>
        </section>
      </div>

      <BottomNav isAdmin />
    </main>
  );
}
