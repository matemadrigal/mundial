'use client';
import { useEffect, useState } from 'react';
import { api, fmtTime, Flag } from '@/components/ui';
import { teamName } from '@/lib/teams';

export const SHORT_LABEL = {
  'Resultado exacto': 'exacto',
  '1X2': '1X2',
  'Córners exactos': 'córners exactos',
  'Córners ±2': 'córners ±2',
  'Más tarjetas': 'más tarjetas'
};

// ---------- selector "más tarjetas" (chips con bandera) ----------
export function CardsPick({ value, onChange, home, away }) {
  const opts = [
    { v: 'home', team: home, label: 'Local' },
    { v: 'draw', team: null, label: 'Empate' },
    { v: 'away', team: away, label: 'Visit.' }
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            className={`chip ${active ? 'chip-active' : ''}`}
            onClick={() => onChange(active ? null : o.v)}
            title={o.team ? teamName(o.team) : o.label}
          >
            {o.team ? <Flag apiName={o.team} size="xs" /> : <span className="text-base font-bold">=</span>}
            <span className="text-[12px]">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- "stepper" grande +/- alrededor del marcador (estilo bet sheet) ----------
function BigStepper({ value, onChange, min = 0, max = 9 }) {
  const v = value ?? 0;
  return (
    <div className="stepper">
      <button type="button" aria-label="menos" className="stepper-btn stepper-btn-minus" onClick={() => onChange(Math.max(min, v - 1))}>−</button>
      <span className="stepper-val">{value == null ? '·' : v}</span>
      <button type="button" aria-label="más" className="stepper-btn stepper-btn-plus" onClick={() => onChange(Math.min(max, v + 1))}>+</button>
    </div>
  );
}

// ---------- formulario inline (panel expandido en /calendario, /predicciones, etc.) ----------
export function PredictionForm({ match, mine, onSaved }) {
  const [hg, setHg] = useState(mine?.home_goals ?? null);
  const [ag, setAg] = useState(mine?.away_goals ?? null);
  const [corners, setCorners] = useState(mine?.corners ?? null);
  const [cards, setCards] = useState(mine?.more_cards ?? null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  async function save() {
    if (hg == null || ag == null) { setMsg('Indica el resultado.'); setOk(false); return; }
    setSaving(true); setMsg('');
    try {
      await api('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({ match_id: match.id, home_goals: hg, away_goals: ag, corners, more_cards: cards })
      });
      setMsg('Guardado.'); setOk(true);
      onSaved && onSaved({ home_goals: hg, away_goals: ag, corners, more_cards: cards });
    } catch (e) {
      setMsg(e.message); setOk(false);
    }
    setSaving(false);
  }

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-4">
      <div className="text-center">
        <div className="eyebrow mb-3">Marcador</div>
        <div className="flex items-center justify-center gap-5">
          <div className="text-center">
            <div className="mb-2"><Flag apiName={match.home_team} size="md" shadow /></div>
            <BigStepper value={hg} onChange={setHg} />
          </div>
          <span className="display text-3xl text-dim2 pb-3 self-end">:</span>
          <div className="text-center">
            <div className="mb-2"><Flag apiName={match.away_team} size="md" shadow /></div>
            <BigStepper value={ag} onChange={setAg} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-2">
        <span className="eyebrow">Córners totales</span>
        <div className="stepper" style={{ gap: 8 }}>
          <button type="button" className="stepper-btn stepper-btn-minus" style={{ width: 32, height: 32, fontSize: 18 }} onClick={() => setCorners((c) => Math.max(0, (c ?? 0) - 1))}>−</button>
          <span className="font-display font-black text-xl text-ink w-7 text-center">{corners ?? '·'}</span>
          <button type="button" className="stepper-btn stepper-btn-plus" style={{ width: 32, height: 32, fontSize: 18 }} onClick={() => setCorners((c) => Math.min(40, (c ?? 0) + 1))}>+</button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Más tarjetas</span>
        <CardsPick value={cards} onChange={setCards} home={match.home_team} away={match.away_team} />
      </div>
      <button className="btn-pitch w-full" onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : mine ? 'Actualizar pronóstico' : 'Confirmar pronóstico'}
      </button>
      {msg ? <p className={`text-center text-sm ${ok ? 'text-pitch-soft-ink' : 'text-live'}`}>{msg}</p> : null}
      <p className="text-[11px] text-center text-dim2">Editable hasta el inicio · {fmtTime(match.kickoff)}</p>
    </div>
  );
}

// ---------- Bet sheet (modal flotante para predecir desde /calendario o dashboard) ----------
export function BetSheet({ match, mine, onSaved, onClose }) {
  const [hg, setHg] = useState(mine?.home_goals ?? 1);
  const [ag, setAg] = useState(mine?.away_goals ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // bloqueo de scroll body
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function save() {
    setSaving(true); setError('');
    try {
      await api('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({
          match_id: match.id,
          home_goals: hg,
          away_goals: ag,
          corners: mine?.corners ?? null,
          more_cards: mine?.more_cards ?? null
        })
      });
      onSaved && onSaved({ home_goals: hg, away_goals: ag, corners: mine?.corners ?? null, more_cards: mine?.more_cards ?? null });
    } catch (e) {
      setError(e.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose && onClose();
  }

  const sign = hg > ag ? 1 : hg < ag ? 2 : 0;
  const Opt = ({ k, label }) => {
    const on = sign === k;
    return (
      <div
        className="flex-1 text-center py-2.5 rounded-xl text-[13px] font-bold"
        style={{
          background: on ? '#0E1116' : '#fff',
          border: `1.5px solid ${on ? '#0E1116' : '#ECEDF0'}`,
          color: on ? '#fff' : '#7f8794'
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Tu predicción">
        <div className="sheet-handle" />
        <div className="text-center mb-2"><span className="eyebrow">Tu predicción</span></div>
        <div className="flex items-center justify-center gap-3 mb-5">
          <Flag apiName={match.home_team} size="sm" />
          <span className="display text-base">{teamName(match.home_team)}</span>
          <span className="text-dim2 font-bold text-sm">vs</span>
          <span className="display text-base">{teamName(match.away_team)}</span>
          <Flag apiName={match.away_team} size="sm" />
        </div>

        <div className="flex items-end justify-center gap-5 mb-6">
          <div className="text-center">
            <div className="mb-3"><Flag apiName={match.home_team} size="lg" shadow /></div>
            <BigStepper value={hg} onChange={setHg} />
          </div>
          <span className="display text-3xl text-dim4 pb-3 self-end">:</span>
          <div className="text-center">
            <div className="mb-3"><Flag apiName={match.away_team} size="lg" shadow /></div>
            <BigStepper value={ag} onChange={setAg} />
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <Opt k={1} label={`Gana ${teamName(match.home_team)}`} />
          <Opt k={0} label="Empate" />
          <Opt k={2} label={`Gana ${teamName(match.away_team)}`} />
        </div>
        <p className="text-center text-[11px] text-dim2 font-semibold mb-4">Clavar marcador +3 pts · acertar 1·X·2 +1 pt</p>

        {error ? <p className="text-center text-sm text-live mb-3" role="alert">{error}</p> : null}
        <button className="btn-pitch w-full" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar predicción'}
        </button>
      </div>
    </>
  );
}

// ---------- Detalle ampliado (alineaciones, forma) ----------
function FormStrip({ teamApiName, form }) {
  if (!form || form.length === 0) {
    return (
      <div>
        <div className="eyebrow mb-1.5">{teamName(teamApiName)} <span className="opacity-50">· forma</span></div>
        <p className="text-[11px] text-dim2">Sin partidos previos en la fuente.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="eyebrow mb-2 flex items-center gap-1.5">
        <Flag apiName={teamApiName} size="xs" /> {teamName(teamApiName)}
      </div>
      <div className="space-y-1">
        {form.map((e) => {
          const bg = e.result === 'W' ? '#1ea84c' : e.result === 'L' ? '#FF5A5F' : e.result === 'D' ? '#9aa1ac' : '#ECEDF0';
          return (
            <div key={e.id} className="flex items-center gap-2 text-[11px]">
              <span style={{ display: 'inline-flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 3, background: bg, color: e.result === 'D' || e.result === '·' ? '#fff' : '#fff', fontWeight: 800, fontFamily: 'Archivo', fontSize: 10 }}>
                {e.result}
              </span>
              <span className="truncate flex-1 text-muted">{e.opponent}</span>
              <span className="font-display font-bold text-dim shrink-0">
                {e.my != null && e.opp != null ? `${e.my}-${e.opp}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineupBlock({ lineup }) {
  if (!lineup || !Array.isArray(lineup) || lineup.length === 0) return null;
  const home = lineup.filter((p) => p.strHome === 'Yes' || p.strHome === '1');
  const away = lineup.filter((p) => p.strHome === 'No' || p.strHome === '0');
  if (home.length === 0 && away.length === 0) return null;
  const renderSide = (side) => (
    <ul className="space-y-0.5 text-[12px]">
      {side.slice(0, 14).map((p, i) => (
        <li key={p.idPlayer || i} className="flex items-center justify-between gap-2">
          <span className="truncate">{p.strPlayer}</span>
          <span className="font-display font-bold text-[10px] text-dim2 shrink-0">{p.strPosition || ''}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div>
      <div className="eyebrow mb-2">Alineaciones</div>
      <div className="grid grid-cols-2 gap-3">
        <div><div className="text-[11px] text-muted mb-1">Local</div>{renderSide(home)}</div>
        <div><div className="text-[11px] text-muted mb-1">Visitante</div>{renderSide(away)}</div>
      </div>
    </div>
  );
}

export function MatchExtras({ matchId, homeApiName, awayApiName, started }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    api(`/api/event/${matchId}`)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [matchId]);

  if (error) return null;
  if (!data) {
    return (
      <div className="mt-4 pt-4 border-t border-line">
        <div className="text-[11px] text-dim2 text-center">Cargando detalle…</div>
      </div>
    );
  }

  const { event, homeForm, awayForm, lineup } = data;
  const venueLine = [event.venue, event.city].filter(Boolean).join(' · ');
  const lineupRendered = (lineup && lineup.length > 0);

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-4">
      {venueLine || event.group ? (
        <div className="flex items-center justify-between text-[11px] text-dim2">
          {venueLine ? <span className="truncate">{venueLine}</span> : <span />}
          {event.group ? <span className="font-display font-bold tracking-widest">GRUPO {event.group}</span> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <FormStrip teamApiName={homeApiName} form={homeForm} />
        <FormStrip teamApiName={awayApiName} form={awayForm} />
      </div>

      <LineupBlock lineup={lineup} />

      {!lineupRendered ? (
        <div className="text-[11px] text-dim2 leading-relaxed">
          Alineaciones {started ? 'no publicadas en la fuente para este partido' : 'aún no publicadas (suelen aparecer poco antes del pitido inicial)'}.
        </div>
      ) : null}
    </div>
  );
}
