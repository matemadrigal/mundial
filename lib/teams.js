// Nombres de API-Football (inglés) -> español + bandera.
// Incluye clasificados y todos los candidatos de playoffs;
// si falta alguno, hay fallback al nombre original con ⚽.

const TEAMS = {
  'Mexico': ['México', '🇲🇽'], 'USA': ['Estados Unidos', '🇺🇸'], 'Canada': ['Canadá', '🇨🇦'],
  'Argentina': ['Argentina', '🇦🇷'], 'Brazil': ['Brasil', '🇧🇷'], 'Uruguay': ['Uruguay', '🇺🇾'],
  'Colombia': ['Colombia', '🇨🇴'], 'Ecuador': ['Ecuador', '🇪🇨'], 'Paraguay': ['Paraguay', '🇵🇾'],
  'Bolivia': ['Bolivia', '🇧🇴'], 'Venezuela': ['Venezuela', '🇻🇪'], 'Chile': ['Chile', '🇨🇱'],
  'Spain': ['España', '🇪🇸'], 'France': ['Francia', '🇫🇷'], 'England': ['Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'],
  'Portugal': ['Portugal', '🇵🇹'], 'Netherlands': ['Países Bajos', '🇳🇱'], 'Germany': ['Alemania', '🇩🇪'],
  'Belgium': ['Bélgica', '🇧🇪'], 'Croatia': ['Croacia', '🇭🇷'], 'Switzerland': ['Suiza', '🇨🇭'],
  'Austria': ['Austria', '🇦🇹'], 'Scotland': ['Escocia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'], 'Norway': ['Noruega', '🇳🇴'],
  'Italy': ['Italia', '🇮🇹'], 'Denmark': ['Dinamarca', '🇩🇰'], 'Turkey': ['Turquía', '🇹🇷'],
  'Ukraine': ['Ucrania', '🇺🇦'], 'Poland': ['Polonia', '🇵🇱'], 'Sweden': ['Suecia', '🇸🇪'],
  'Wales': ['Gales', '🏴󠁧󠁢󠁷󠁬󠁳󠁿'], 'Czech Republic': ['Chequia', '🇨🇿'], 'Czechia': ['Chequia', '🇨🇿'],
  'Slovakia': ['Eslovaquia', '🇸🇰'], 'Romania': ['Rumanía', '🇷🇴'], 'Hungary': ['Hungría', '🇭🇺'],
  'Serbia': ['Serbia', '🇷🇸'], 'Greece': ['Grecia', '🇬🇷'], 'Slovenia': ['Eslovenia', '🇸🇮'],
  'Albania': ['Albania', '🇦🇱'], 'North Macedonia': ['Macedonia del Norte', '🇲🇰'],
  'Bosnia and Herzegovina': ['Bosnia', '🇧🇦'], 'Bosnia & Herzegovina': ['Bosnia', '🇧🇦'],
  'Kosovo': ['Kosovo', '🇽🇰'], 'Republic of Ireland': ['Irlanda', '🇮🇪'], 'Ireland': ['Irlanda', '🇮🇪'],
  'Northern Ireland': ['Irlanda del Norte', '🇬🇧'], 'Iceland': ['Islandia', '🇮🇸'],
  'Morocco': ['Marruecos', '🇲🇦'], 'Senegal': ['Senegal', '🇸🇳'], 'Tunisia': ['Túnez', '🇹🇳'],
  'Egypt': ['Egipto', '🇪🇬'], 'Algeria': ['Argelia', '🇩🇿'], 'Ghana': ['Ghana', '🇬🇭'],
  'Ivory Coast': ['Costa de Marfil', '🇨🇮'], 'Cote D\'Ivoire': ['Costa de Marfil', '🇨🇮'],
  'South Africa': ['Sudáfrica', '🇿🇦'], 'Cape Verde Islands': ['Cabo Verde', '🇨🇻'],
  'Cape Verde': ['Cabo Verde', '🇨🇻'], 'Nigeria': ['Nigeria', '🇳🇬'], 'Cameroon': ['Camerún', '🇨🇲'],
  'DR Congo': ['RD Congo', '🇨🇩'], 'Congo DR': ['RD Congo', '🇨🇩'], 'Gabon': ['Gabón', '🇬🇦'],
  'Japan': ['Japón', '🇯🇵'], 'South Korea': ['Corea del Sur', '🇰🇷'], 'Korea Republic': ['Corea del Sur', '🇰🇷'],
  'Iran': ['Irán', '🇮🇷'], 'Australia': ['Australia', '🇦🇺'], 'Saudi Arabia': ['Arabia Saudí', '🇸🇦'],
  'Qatar': ['Catar', '🇶🇦'], 'Uzbekistan': ['Uzbekistán', '🇺🇿'], 'Jordan': ['Jordania', '🇯🇴'],
  'Iraq': ['Irak', '🇮🇶'], 'United Arab Emirates': ['Emiratos Árabes', '🇦🇪'],
  'Panama': ['Panamá', '🇵🇦'], 'Haiti': ['Haití', '🇭🇹'], 'Curacao': ['Curazao', '🇨🇼'],
  'Jamaica': ['Jamaica', '🇯🇲'], 'Costa Rica': ['Costa Rica', '🇨🇷'], 'Honduras': ['Honduras', '🇭🇳'],
  'Suriname': ['Surinam', '🇸🇷'], 'New Zealand': ['Nueva Zelanda', '🇳🇿'],
  'New Caledonia': ['Nueva Caledonia', '🇳🇨']
};

export function teamName(apiName) {
  const t = TEAMS[apiName];
  return t ? t[0] : (apiName || '—');
}

export function teamFlag(apiName) {
  const t = TEAMS[apiName];
  return t ? t[1] : '⚽';
}

// Traducción de fases de API-Football al español
export function stageES(round) {
  if (!round) return '';
  const r = String(round);
  if (/group/i.test(r)) return r.replace(/Group Stage - |Group /i, 'Grupo ').replace('Grupo Stage', 'Fase de grupos');
  if (/round of 32/i.test(r)) return 'Dieciseisavos';
  if (/round of 16/i.test(r)) return 'Octavos';
  if (/quarter/i.test(r)) return 'Cuartos';
  if (/semi/i.test(r)) return 'Semifinal';
  if (/3rd place/i.test(r)) return '3er puesto';
  if (/final/i.test(r)) return 'FINAL';
  return r;
}
