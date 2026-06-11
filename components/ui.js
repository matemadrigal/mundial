'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { flagUrl, teamName } from '@/lib/teams';

// ---------- utilidades ----------
export async function api(path, opts) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('unauthorized');
  }
  if (!res.ok) throw new Error(json.error || 'Error de red');
  return json;
}

const TZ = 'Europe/Madrid';
const KICKOFF_DAY_ONE = Date.UTC(2026, 5, 11);

export function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-ES', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}
export function fmtDayLong(iso) {
  if (!iso) return '—';
  const s = new Date(iso).toLocaleDateString('es-ES', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function fmtDayShort(iso) {
  if (!iso) return '—';
  const s = new Date(iso).toLocaleDateString('es-ES', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function dayKey(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ });
}
export function tournamentDay(iso) {
  if (!iso) return null;
  const d = Math.floor((new Date(iso).getTime() - KICKOFF_DAY_ONE) / 86400000) + 1;
  return d >= 1 ? d : null;
}
export function timeUntil(iso) {
  if (!iso) return null;
  let ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const dys = Math.floor(ms / 86400000); ms -= dys * 86400000;
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const m = Math.floor(ms / 60000);
  if (dys > 0) return `${dys}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}
export function initials(name) {
  if (!name) return '·';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 0) return '·';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// ---------- Bandera real (flagcdn.com) ----------
const FLAG_DIMS = {
  xs: { w: 22, h: 16, r: 3 },
  sm: { w: 26, h: 19, r: 4 },
  md: { w: 30, h: 22, r: 4 },
  lg: { w: 40, h: 29, r: 5 },
  xl: { w: 64, h: 46, r: 7 },
  hero: { w: 74, h: 53, r: 8 }
};

export function Flag({ apiName, size = 'sm', shadow = false, className = '', title }) {
  const url = flagUrl(apiName);
  const d = FLAG_DIMS[size] || FLAG_DIMS.sm;
  const [errored, setErrored] = useState(false);
  const baseStyle = {
    width: d.w, height: d.h, borderRadius: d.r, objectFit: 'cover', display: 'inline-block', flexShrink: 0
  };
  if (!url || errored) {
    return (
      <span
        aria-label={title || apiName || 'bandera'}
        title={title || apiName}
        className={className}
        style={{ ...baseStyle, background: '#ECEDF0', border: '1px solid #DDE0E4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo', fontWeight: 800, fontSize: Math.max(8, d.h - 8), color: '#7f8794' }}
      >
        {apiName ? String(apiName).slice(0, 2).toUpperCase() : '?'}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={teamName(apiName)}
      title={title || teamName(apiName)}
      width={d.w}
      height={d.h}
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
      style={{ ...baseStyle, boxShadow: shadow ? '0 6px 16px rgba(0,0,0,.25)' : 'none' }}
    />
  );
}

// ---------- iconos SVG ----------
function IcoHome(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 11l9-7 9 7"/><path d="M5 9.5V20h14V9.5"/></svg>); }
function IcoFixtures(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="9"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/></svg>); }
function IcoRanking(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 20V10M12 20V4M18 20v-7"/></svg>); }
function IcoProfile(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="8" r="4"/><path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>); }
function IcoAdmin(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3l8 4v5c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V7l8-4z"/><path d="M9.5 12l2 2 3.5-4"/></svg>); }
function IcoPena(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c0-3 2.7-5 6-5s6 2 6 5"/><path d="M14 20c0-2.4 2.2-4 4-4s4 1.6 4 4"/></svg>); }
function IcoLogout(props) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11"/></svg>); }

export function Logout({ tone = 'light' }) {
  async function out() {
    try { await api('/api/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login';
  }
  return (
    <button onClick={out} aria-label="Cerrar sesión"
      className={tone === 'dark' ? 'text-white/70 hover:text-white' : 'text-dim hover:text-ink'}
      style={{ padding: 6, transition: 'color .12s ease' }}>
      <IcoLogout style={{ width: 18, height: 18 }} />
    </button>
  );
}

// ---------- Bottom Nav ----------
const TABS = [
  { href: '/calendario', label: 'Partidos', Ico: IcoFixtures },
  { href: '/predicciones', label: 'Mis', Ico: IcoHome },
  { href: '/pena', label: 'Peña', Ico: IcoPena },
  { href: '/clasificacion', label: 'Ranking', Ico: IcoRanking },
  { href: '/perfil', label: 'Perfil', Ico: IcoProfile }
];

export function BottomNav({ isAdmin }) {
  const path = usePathname();
  const router = useRouter();
  const tabs = isAdmin ? [...TABS, { href: '/admin', label: 'Admin', Ico: IcoAdmin }] : TABS;
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => {
        const active = t.href === '/' ? path === '/' : path?.startsWith(t.href);
        return (
          <button
            key={t.href}
            type="button"
            className={active ? 'active' : ''}
            onClick={() => router.push(t.href)}
          >
            <span className="bar" />
            <span className="ico"><t.Ico /></span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------- Avatar redondo por jugador (color persistente) ----------
const AVATAR_PALETTE = ['#FFE7A8', '#BBEBD0', '#FFCED0', '#C8D6FF', '#FBD3A8', '#D3CDFF', '#FFE3D2', '#C9F1E1'];

export function avatarColor(name) {
  if (!name) return AVATAR_PALETTE[0];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function Avatar({ name, size = 'sm', highlightMe = false }) {
  const sz = { xs: 28, sm: 38, md: 44, lg: 54, xl: 72 }[size] || 38;
  const fz = { xs: 12, sm: 14, md: 16, lg: 20, xl: 28 }[size] || 14;
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: sz, height: sz, fontSize: fz,
        background: avatarColor(name),
        border: highlightMe ? '2px solid #22c372' : '0'
      }}
    >
      {initials(name)}
    </span>
  );
}

// ---------- Spinner ligero ----------
export function Spinner({ tone = 'light' }) {
  const borderBase = tone === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(15,18,25,0.08)';
  const borderTop = '#22c372';
  return (
    <div className="flex justify-center items-center py-16" role="status" aria-label="Cargando">
      <div className="relative" style={{ width: 32, height: 32 }}>
        <div className="absolute inset-0 rounded-full" style={{ border: `2.5px solid ${borderBase}` }} />
        <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '2.5px solid transparent', borderTopColor: borderTop }} />
      </div>
    </div>
  );
}

// ---------- Cuenta atrás HH:MM:SS reactiva ----------
export function Countdown({ targetIso, onZero }) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const rem = target ? Math.max(0, Math.floor((target - now) / 1000)) : 0;
  useEffect(() => {
    if (target && rem === 0 && !fired.current) {
      fired.current = true;
      onZero && onZero();
    }
  }, [rem, target, onZero]);
  const p2 = (n) => String(n).padStart(2, '0');
  const days = Math.floor(rem / 86400);
  const h = Math.floor((rem % 86400) / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const s = rem % 60;
  return (
    <div className="flex items-start justify-center gap-1.5 font-display">
      {days > 0 ? (
        <>
          <Digit value={`${days}`} label="DÍAS" />
          <Sep />
        </>
      ) : null}
      <Digit value={p2(h)} label="HRS" />
      <Sep />
      <Digit value={p2(m)} label="MIN" />
      <Sep />
      <Digit value={p2(s)} label="SEG" tone="pitch" />
    </div>
  );
}
function Sep() { return <span className="text-2xl text-[#3a414d]" style={{ lineHeight: 1 }}>:</span>; }
function Digit({ value, label, tone }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-black leading-none" style={{ color: tone === 'pitch' ? '#22c372' : '#fff' }}>{value}</div>
      <div className="text-[9px] tracking-widest text-[#7f8794] font-bold mt-1.5">{label}</div>
    </div>
  );
}

// ---------- Toast simple ----------
export function Toast({ visible, text = 'Predicción guardada' }) {
  if (!visible) return null;
  return (
    <div className="toast" role="status">
      <span className="check">✓</span> {text}
    </div>
  );
}
