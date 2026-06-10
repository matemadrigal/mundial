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
const KICKOFF_DAY_ONE = Date.UTC(2026, 5, 11); // 11 jun 2026

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
  return new Date(iso).toLocaleDateString('sv-SE', { timeZone: TZ }); // YYYY-MM-DD
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

// ---------- componentes ----------
export function TopBar({ title, sub, right }) {
  return (
    <header className="sticky top-0 z-40 px-4 pt-4 pb-3 bg-gradient-to-b from-[#092A21] via-[#092A21f2] to-transparent">
      <div className="flex items-end justify-between max-w-xl mx-auto">
        <div>
          <h1 className="display text-2xl text-gold leading-none">{title}</h1>
          {sub ? <p className="text-xs mt-1.5 opacity-60 font-medium">{sub}</p> : null}
        </div>
        {right || null}
      </div>
    </header>
  );
}

const TABS = [
  { href: '/calendario', label: 'Partidos', ico: '📅' },
  { href: '/predicciones', label: 'Mis apuestas', ico: '🎯' },
  { href: '/clasificacion', label: 'Clasificación', ico: '🏆' },
];

export function BottomNav({ isAdmin }) {
  const path = usePathname();
  const router = useRouter();
  const tabs = isAdmin ? [...TABS, { href: '/admin', label: 'Admin', ico: '🛠️' }] : TABS;
  return (
    <nav className="bottom-nav flex">
      {tabs.map((t) => (
        <a
          key={t.href}
          href={t.href}
          className={path === t.href ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); router.push(t.href); }}
        >
          <span className="ico">{t.ico}</span>
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
    <div className="flex justify-center items-center py-16">
      <div className="text-4xl animate-bounce">⚽</div>
    </div>
  );
}
