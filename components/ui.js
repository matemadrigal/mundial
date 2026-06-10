'use client';
import { usePathname, useRouter } from 'next/navigation';

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
  return new Date(iso).toLocaleTimeString('es-ES', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit',
  });
}

export function fmtDayLong(iso) {
  const s = new Date(iso).toLocaleDateString('es-ES', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dayKey(iso) {
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ });
}

export function tournamentDay(iso) {
  const d = Math.floor((new Date(iso).getTime() - KICKOFF_DAY_ONE) / 86400000) + 1;
  return d >= 1 ? d : null;
}

export function timeUntil(iso) {
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
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// ---------- iconos SVG inline ----------
function IcoFixtures(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IcoBets(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
function IcoLeaderboard(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20h4V10H4zM10 20h4V4h-4zM16 20h4v-7h-4z" />
    </svg>
  );
}
function IcoAdmin(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l8 4v5c0 4.5-3.4 8.4-8 9-4.6-.6-8-4.5-8-9V7l8-4z" />
      <path d="M9.5 12l2 2 3.5-4" />
    </svg>
  );
}
function IcoLogout(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
    </svg>
  );
}

// ---------- componentes ----------
export function TopBar({ title, sub, right }) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 pb-3 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#262626]">
      <div className="flex items-center justify-between max-w-xl mx-auto gap-3">
        <div className="min-w-0">
          <div className="eyebrow mb-0.5">LA PORRA · WC26</div>
          <h1 className="display text-lg leading-none truncate">{title}</h1>
          {sub ? <p className="text-xs mt-1 text-muted truncate">{sub}</p> : null}
        </div>
        {right || null}
      </div>
    </header>
  );
}

export function Logout() {
  async function out() {
    try { await api('/api/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login';
  }
  return (
    <button onClick={out} aria-label="Cerrar sesión" className="text-muted hover:text-ink transition-colors p-1.5">
      <IcoLogout style={{ width: 18, height: 18 }} />
    </button>
  );
}

const TABS = [
  { href: '/calendario', label: 'PARTIDOS', Ico: IcoFixtures },
  { href: '/predicciones', label: 'APUESTAS', Ico: IcoBets },
  { href: '/clasificacion', label: 'RANKING', Ico: IcoLeaderboard },
];

export function BottomNav({ isAdmin }) {
  const path = usePathname();
  const router = useRouter();
  const tabs = isAdmin ? [...TABS, { href: '/admin', label: 'ADMIN', Ico: IcoAdmin }] : TABS;
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          className={path === t.href ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); router.push(t.href); }}
        >
          <span className="ico"><t.Ico /></span>
          {t.label}
        </a>
      ))}
    </nav>
  );
}

export function Stepper({ value, onChange, min = 0, max = 20 }) {
  const v = value ?? 0;
  return (
    <div className="stepper">
      <button type="button" aria-label="menos" onClick={() => onChange(Math.max(min, v - 1))}>−</button>
      <div className="val">{value == null ? '·' : v}</div>
      <button type="button" aria-label="más" onClick={() => onChange(Math.min(max, v + 1))}>+</button>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center items-center py-16" role="status" aria-label="Cargando">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-[#262626]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#ffdd00] animate-spin" />
      </div>
    </div>
  );
}

export function Avatar({ name, me }) {
  return (
    <span className={`avatar ${me ? 'avatar-me' : ''}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
