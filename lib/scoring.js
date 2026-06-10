// ============================================================
// SISTEMA DE PUNTOS · fuente única de verdad
// Se evalúa sobre el marcador al final del tiempo jugado
// (90' o 120'). Si hay penaltis, el "resultado" es empate:
// quien predijo empate acierta el 1X2.
// ============================================================

export const RULES = [
  { label: 'Resultado exacto', pts: 3 },
  { label: 'Acertar 1X2 (sin exacto)', pts: 1 },
  { label: 'Córners totales exactos', pts: 2 },
  { label: 'Córners ±2', pts: 1 },
  { label: 'Equipo con más tarjetas', pts: 1 },
  { label: 'Campeón del Mundial', pts: 10 },
  { label: 'Pichichi (máximo goleador)', pts: 5 }
];

export const FINISHED = ['FT', 'AET', 'PEN'];

function sign1x2(home, away) {
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

// Devuelve { points, detail: [{label, pts}] } para una predicción
export function scorePrediction(pred, match) {
  const detail = [];
  let points = 0;

  const mh = match.home_goals;
  const ma = match.away_goals;
  if (mh == null || ma == null) return { points: 0, detail };

  // Resultado
  if (pred.home_goals === mh && pred.away_goals === ma) {
    points += 3;
    detail.push({ label: 'Resultado exacto', pts: 3 });
  } else if (sign1x2(pred.home_goals, pred.away_goals) === sign1x2(mh, ma)) {
    points += 1;
    detail.push({ label: '1X2', pts: 1 });
  }

  // Córners (solo si tenemos el dato real y el usuario predijo)
  if (pred.corners != null && match.total_corners != null) {
    const diff = Math.abs(pred.corners - match.total_corners);
    if (diff === 0) {
      points += 2;
      detail.push({ label: 'Córners exactos', pts: 2 });
    } else if (diff <= 2) {
      points += 1;
      detail.push({ label: 'Córners ±2', pts: 1 });
    }
  }

  // Tarjetas (amarillas + rojas por equipo)
  if (pred.more_cards && match.home_cards != null && match.away_cards != null) {
    let real = 'draw';
    if (match.home_cards > match.away_cards) real = 'home';
    if (match.away_cards > match.home_cards) real = 'away';
    if (pred.more_cards === real) {
      points += 1;
      detail.push({ label: 'Más tarjetas', pts: 1 });
    }
  }

  return { points, detail };
}

export const GLOBAL_POINTS = { champion: 10, top_scorer: 5 };
