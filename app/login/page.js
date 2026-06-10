'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/components/ui';
import { allCodes } from '@/lib/teams';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true); setError('');
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
      router.push('/calendario');
    } catch (err) {
      setError(err.message); setLoading(false);
    }
  }

  const codes = allCodes().slice(0, 24);

  return (
    <main className="min-h-dvh flex flex-col">
      <section className="hero-night px-6 pt-16 pb-10">
        <div className="eyebrow text-white/60 mb-2">Casa de apuestas privada</div>
        <h1 className="brand text-5xl leading-[0.95] text-white">LA PORRA</h1>
        <h2 className="brand text-5xl leading-[0.95] text-pitch">WC26</h2>
        <p className="font-display text-[11px] tracking-widest text-white/45 mt-4">MEX · USA · CAN — 11 JUN / 19 JUL</p>

        <div className="flag-marquee mt-7">
          <div className="flag-marquee-track">
            {[...codes, ...codes].map((c, i) => (
              <img key={i} src={`https://flagcdn.com/w160/${c}.png`} alt="" width={34} height={24}
                style={{ borderRadius: 4, opacity: 0.5, objectFit: 'cover', display: 'block' }} />
            ))}
          </div>
        </div>
      </section>

      <div className="flex-1 flex items-center justify-center px-6 pb-12 -mt-8 relative z-10">
        <form onSubmit={submit} className="card p-6 w-full max-w-sm">
          <div className="eyebrow mb-2">Acceso</div>
          <label className="block text-sm font-bold text-ink mb-2">Contraseña personal</label>
          <input
            className="input font-display"
            type="password"
            autoComplete="current-password"
            placeholder="• • • • • • • •"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error ? <p className="text-sm text-live mt-3" role="alert">{error}</p> : null}
          <button className="btn-pitch w-full mt-4" disabled={loading}>
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
          <p className="text-[11px] text-dim2 mt-5 leading-relaxed">
            Acceso restringido a los 4 jugadores autorizados. Cada cuenta tiene una contraseña única.
          </p>
        </form>
      </div>
    </main>
  );
}
