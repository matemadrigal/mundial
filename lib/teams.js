// Mapa nombre API (inglés) -> { español, bandera emoji (fallback), código
// ISO-2 para flagcdn.com }. Las banderas se pintan con <Flag/> apuntando
// a https://flagcdn.com/w160/<code>.png, que sí se ven en cualquier
// dispositivo. El emoji queda como fallback para opciones de <select>
// y entornos sin imagen disponible.

// Códigos especiales que flagcdn.com soporta para sub-naciones del Reino Unido:
// gb-eng, gb-sct, gb-wls, gb-nir.

const T = (es, emoji, code) => ({ es, emoji, code });

const TEAMS = {
  // CONCACAF
  'Mexico': T('México', '🇲🇽', 'mx'),
  'USA': T('Estados Unidos', '🇺🇸', 'us'),
  'United States': T('Estados Unidos', '🇺🇸', 'us'),
  'Canada': T('Canadá', '🇨🇦', 'ca'),
  'Panama': T('Panamá', '🇵🇦', 'pa'),
  'Haiti': T('Haití', '🇭🇹', 'ht'),
  'Curacao': T('Curazao', '🇨🇼', 'cw'),
  'Curaçao': T('Curazao', '🇨🇼', 'cw'),
  'Jamaica': T('Jamaica', '🇯🇲', 'jm'),
  'Costa Rica': T('Costa Rica', '🇨🇷', 'cr'),
  'Honduras': T('Honduras', '🇭🇳', 'hn'),
  'Suriname': T('Surinam', '🇸🇷', 'sr'),

  // CONMEBOL
  'Argentina': T('Argentina', '🇦🇷', 'ar'),
  'Brazil': T('Brasil', '🇧🇷', 'br'),
  'Uruguay': T('Uruguay', '🇺🇾', 'uy'),
  'Colombia': T('Colombia', '🇨🇴', 'co'),
  'Ecuador': T('Ecuador', '🇪🇨', 'ec'),
  'Paraguay': T('Paraguay', '🇵🇾', 'py'),
  'Bolivia': T('Bolivia', '🇧🇴', 'bo'),
  'Venezuela': T('Venezuela', '🇻🇪', 've'),
  'Chile': T('Chile', '🇨🇱', 'cl'),

  // UEFA
  'Spain': T('España', '🇪🇸', 'es'),
  'France': T('Francia', '🇫🇷', 'fr'),
  'England': T('Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'gb-eng'),
  'Portugal': T('Portugal', '🇵🇹', 'pt'),
  'Netherlands': T('Países Bajos', '🇳🇱', 'nl'),
  'Germany': T('Alemania', '🇩🇪', 'de'),
  'Belgium': T('Bélgica', '🇧🇪', 'be'),
  'Croatia': T('Croacia', '🇭🇷', 'hr'),
  'Switzerland': T('Suiza', '🇨🇭', 'ch'),
  'Austria': T('Austria', '🇦🇹', 'at'),
  'Scotland': T('Escocia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'gb-sct'),
  'Norway': T('Noruega', '🇳🇴', 'no'),
  'Italy': T('Italia', '🇮🇹', 'it'),
  'Denmark': T('Dinamarca', '🇩🇰', 'dk'),
  'Turkey': T('Turquía', '🇹🇷', 'tr'),
  'Türkiye': T('Turquía', '🇹🇷', 'tr'),
  'Ukraine': T('Ucrania', '🇺🇦', 'ua'),
  'Poland': T('Polonia', '🇵🇱', 'pl'),
  'Sweden': T('Suecia', '🇸🇪', 'se'),
  'Wales': T('Gales', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'gb-wls'),
  'Czech Republic': T('Chequia', '🇨🇿', 'cz'),
  'Czechia': T('Chequia', '🇨🇿', 'cz'),
  'Slovakia': T('Eslovaquia', '🇸🇰', 'sk'),
  'Romania': T('Rumanía', '🇷🇴', 'ro'),
  'Hungary': T('Hungría', '🇭🇺', 'hu'),
  'Serbia': T('Serbia', '🇷🇸', 'rs'),
  'Greece': T('Grecia', '🇬🇷', 'gr'),
  'Slovenia': T('Eslovenia', '🇸🇮', 'si'),
  'Albania': T('Albania', '🇦🇱', 'al'),
  'North Macedonia': T('Macedonia del Norte', '🇲🇰', 'mk'),
  'Bosnia and Herzegovina': T('Bosnia', '🇧🇦', 'ba'),
  'Bosnia & Herzegovina': T('Bosnia', '🇧🇦', 'ba'),
  'Bosnia-Herzegovina': T('Bosnia', '🇧🇦', 'ba'),
  'Kosovo': T('Kosovo', '🇽🇰', 'xk'),
  'Republic of Ireland': T('Irlanda', '🇮🇪', 'ie'),
  'Ireland': T('Irlanda', '🇮🇪', 'ie'),
  'Northern Ireland': T('Irlanda del Norte', '🇬🇧', 'gb-nir'),
  'Iceland': T('Islandia', '🇮🇸', 'is'),

  // CAF
  'Morocco': T('Marruecos', '🇲🇦', 'ma'),
  'Senegal': T('Senegal', '🇸🇳', 'sn'),
  'Tunisia': T('Túnez', '🇹🇳', 'tn'),
  'Egypt': T('Egipto', '🇪🇬', 'eg'),
  'Algeria': T('Argelia', '🇩🇿', 'dz'),
  'Ghana': T('Ghana', '🇬🇭', 'gh'),
  'Ivory Coast': T('Costa de Marfil', '🇨🇮', 'ci'),
  "Cote D'Ivoire": T('Costa de Marfil', '🇨🇮', 'ci'),
  'South Africa': T('Sudáfrica', '🇿🇦', 'za'),
  'Cape Verde Islands': T('Cabo Verde', '🇨🇻', 'cv'),
  'Cape Verde': T('Cabo Verde', '🇨🇻', 'cv'),
  'Nigeria': T('Nigeria', '🇳🇬', 'ng'),
  'Cameroon': T('Camerún', '🇨🇲', 'cm'),
  'DR Congo': T('RD Congo', '🇨🇩', 'cd'),
  'Congo DR': T('RD Congo', '🇨🇩', 'cd'),
  'Gabon': T('Gabón', '🇬🇦', 'ga'),

  // AFC
  'Japan': T('Japón', '🇯🇵', 'jp'),
  'South Korea': T('Corea del Sur', '🇰🇷', 'kr'),
  'Korea Republic': T('Corea del Sur', '🇰🇷', 'kr'),
  'Iran': T('Irán', '🇮🇷', 'ir'),
  'Australia': T('Australia', '🇦🇺', 'au'),
  'Saudi Arabia': T('Arabia Saudí', '🇸🇦', 'sa'),
  'Qatar': T('Catar', '🇶🇦', 'qa'),
  'Uzbekistan': T('Uzbekistán', '🇺🇿', 'uz'),
  'Jordan': T('Jordania', '🇯🇴', 'jo'),
  'Iraq': T('Irak', '🇮🇶', 'iq'),
  'United Arab Emirates': T('Emiratos Árabes', '🇦🇪', 'ae'),

  // OFC
  'New Zealand': T('Nueva Zelanda', '🇳🇿', 'nz'),
  'New Caledonia': T('Nueva Caledonia', '🇳🇨', 'nc')
};

// Función robusta: tolera nulls, vacíos y mayúsculas raras
function get(apiName) {
  if (!apiName || typeof apiName !== 'string') return null;
  return TEAMS[apiName.trim()] || null;
}

export function teamName(apiName) {
  const t = get(apiName);
  return t ? t.es : (apiName || '—');
}

export function teamFlag(apiName) {
  const t = get(apiName);
  return t ? t.emoji : '⚽';
}

export function teamCode(apiName) {
  const t = get(apiName);
  return t ? t.code : null;
}

export function flagUrl(apiName, width = 160) {
  const code = teamCode(apiName);
  return code ? `https://flagcdn.com/w${width}/${code}.png` : null;
}

// Lista de todos los códigos para la tira animada del Mundial
export function allCodes() {
  const seen = new Set();
  return Object.values(TEAMS)
    .map((t) => t.code)
    .filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });
}

// Traducción de fases de la fuente al español
export function stageES(round) {
  if (!round) return '';
  const r = String(round);
  if (/group\s+[A-L]\b/i.test(r)) {
    const letter = r.match(/group\s+([A-L])/i)[1].toUpperCase();
    const j = r.match(/jornada\s*(\d+)/i)?.[1];
    return j ? `Grupo ${letter} · J${j}` : `Grupo ${letter}`;
  }
  if (/group stage|fase de grupos/i.test(r)) {
    const j = r.match(/jornada\s*(\d+)/i)?.[1];
    return j ? `Fase de grupos · J${j}` : 'Fase de grupos';
  }
  if (/round of 32/i.test(r)) return 'Dieciseisavos';
  if (/round of 16/i.test(r)) return 'Octavos';
  if (/quarter/i.test(r)) return 'Cuartos';
  if (/semi/i.test(r)) return 'Semifinal';
  if (/3rd place/i.test(r)) return '3er puesto';
  if (/^final$/i.test(r) || /finale?$/i.test(r)) return 'Final';
  return r;
}
