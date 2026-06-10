'use client';
import { useState } from 'react';
import { api, fmtTime, Stepper } from '@/components/ui';
import { teamFlag } from '@/lib/teams';

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
