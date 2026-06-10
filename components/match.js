'use client';
import { useEffect, useState } from 'react';
import { api, fmtTime, Stepper } from '@/components/ui';
import { teamFlag, teamName } from '@/lib/teams';

// Etiqueta corta para el desglose de puntos
export const SHORT_LABEL = {
  'Resultado exacto': 'exacto',
  '1X2': '1X2',
  'Córners exactos': 'córners exactos',
  'Córners ±2': 'córners ±2',
  'Más tarjetas': 'más tarjetas'
};

export function CardsPick({ value, onChange, home, away }) {
  const opts = [
    { v: 'home', label: teamFlag(home), title: home },
    { v: 'draw', label: '=', title: 'Empate' },
    { v: 'away', label: teamFlag(away), title: away },
  ];
  return (
    <div className="flex gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          title={o.title}
          className={`chip ${value === o.v ? 'chip-active' : ''}`}
          onClick={() => onChange(value === o.v ? null : o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PredictionForm({ match, mine, onSaved }) {
  const [hg, setHg] = useState(mine?.home_goals ?? null);
  const [ag, setAg] = useState(mine?.away_goals ?? null);
  const [corners, setCorners] = useState(mine?.corners ?? null);
  const [cards, setCards] = useState(mine?.more_cards ?? null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tone, setTone] = useState('muted');

  async function save() {
    if (hg == null || ag == null) { setMsg('Indica el resultado.'); setTone('live'); return; }
    setSaving(true);
    setMsg('');
    try {
      await api('/api/predictions', {
        method: 'POST',
        body: JSON.stringify({ match_id: match.id, home_goals: hg, away_goals: ag, corners, more_cards: cards }),
      });
      setMsg('Guardado.');
      setTone('ok');
      onSaved && onSaved({ home_goals: hg, away_goals: ag, corners, more_cards: cards });
    } catch (e) {
      setMsg(e.message);
      setTone('live');
    }
    setSaving(false);
  }

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-4">
      <div>
        <div className="eyebrow mb-2">Resultado</div>
        <div className="flex items-center justify-center gap-4">
          <Stepper value={hg} onChange={setHg} />
          <span className="mono text-lg text-dim">:</span>
          <Stepper value={ag} onChange={setAg} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Córners totales</span>
        <Stepper value={corners} onChange={setCorners} max={40} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">Más tarjetas</span>
        <CardsPick value={cards} onChange={setCards} home={match.home_team} away={match.away_team} />
      </div>
      <button className="btn-gold w-full" onClick={save} disabled={saving}>
        {saving ? 'Guardando…' : mine ? 'Actualizar pronóstico' : 'Confirmar pronóstico'}
      </button>
      {msg ? <p className={`text-center text-sm text-${tone}`}>{msg}</p> : null}
      <p className="text-[11px] text-center text-dim">Editable hasta el inicio · {fmtTime(match.kickoff)}</p>
    </div>
  );
}

// ----- Detalle ampliado del partido (lazy, una llamada por expansión) -----

function FormStrip({ teamApiName, form }) {
  if (!form || form.length === 0) {
    return (
      <div>
        <div className="eyebrow mb-1.5">{teamName(teamApiName)} <span className="opacity-50">· forma</span></div>
        <p className="text-[11px] text-dim">Sin partidos previos en la fuente.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="eyebrow mb-1.5">{teamName(teamApiName)} <span className="opacity-50">· últimos {form.length}</span></div>
      <div className="space-y-1">
        {form.map((e) => {
          const color = e.result === 'W' ? 'bg-ok' : e.result === 'L' ? 'bg-live' : e.result === 'D' ? 'bg-[#404040]' : 'bg-surface2';
          return (
            <div key={e.id} className="flex items-center gap-2 text-[11px]">
              <span className={`inline-flex w-4 h-4 items-center justify-center rounded-sm text-[10px] font-bold text-[#0a0a0a] ${color}`}>
                {e.result}
              </span>
              <span className="truncate flex-1 text-muted">{e.opponent}</span>
              <span className="mono text-dim shrink-0">
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
  // TheSportsDB devuelve un array de jugadores por equipo (strHome/strAway, strFormation, strPlayer, strPosition).
  // Si no hay datos, no se renderiza.
  if (!lineup || !Array.isArray(lineup) || lineup.length === 0) return null;
  const home = lineup.filter((p) => p.strHome === 'Yes' || p.strHome === '1');
  const away = lineup.filter((p) => p.strHome === 'No' || p.strHome === '0');
  if (home.length === 0 && away.length === 0) return null;
  const renderSide = (side) => (
    <ul className="space-y-0.5 text-[12px]">
      {side.slice(0, 14).map((p, i) => (
        <li key={p.idPlayer || i} className="flex items-center justify-between gap-2">
          <span className="truncate">{p.strPlayer}</span>
          <span className="mono text-[10px] text-dim shrink-0">{p.strPosition || ''}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div>
      <div className="eyebrow mb-2">Alineaciones</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] text-muted mb-1">Local</div>
          {renderSide(home)}
        </div>
        <div>
          <div className="text-[11px] text-muted mb-1">Visitante</div>
          {renderSide(away)}
        </div>
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
        <div className="text-[11px] text-dim text-center">Cargando detalle…</div>
      </div>
    );
  }

  const { event, homeForm, awayForm, lineup } = data;
  const venueLine = [event.venue, event.city].filter(Boolean).join(' · ');
  const lineupRendered = (lineup && lineup.length > 0);

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-4">
      {venueLine || event.group ? (
        <div className="flex items-center justify-between text-[11px] text-dim">
          {venueLine ? <span className="truncate">{venueLine}</span> : <span />}
          {event.group ? <span className="mono tracking-widest">GRUPO {event.group}</span> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <FormStrip teamApiName={homeApiName} form={homeForm} />
        <FormStrip teamApiName={awayApiName} form={awayForm} />
      </div>

      <LineupBlock lineup={lineup} />

      {!lineupRendered ? (
        <div className="text-[11px] text-dim leading-relaxed">
          Alineaciones {started ? 'no publicadas en la fuente para este partido' : 'aún no publicadas (suelen aparecer poco antes del pitido inicial)'}.
        </div>
      ) : null}
    </div>
  );
}

