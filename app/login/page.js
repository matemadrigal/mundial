'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/components/ui';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
      router.push('/calendario');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6 pb-20">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="display text-4xl text-gold leading-tight">
          LA PORRA<br />MUNDIAL
        </h1>
        <p className="mt-3 text-sm tracking-[0.3em] opacity-60 font-semibold">
          MEX · USA · CAN — 2026
        </p>
      </div>

      <form onSubmit={submit} className="ticket w-full max-w-sm p-6">
        <label className="block text-xs font-bold tracking-widest opacity-70 mb-2 uppercase">
          Tu contraseña secreta
        </label>
        <input
          className="input"
          type="password"
          inputMode="text"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error ? <p className="text-sm mt-3" style={{ color: '#E8836B' }}>{error}</p> : null}
        <button className="btn-gold w-full mt-4" disabled={loading}>
          {loading ? 'Entrando…' : 'Saltar al campo →'}
        </button>
        <p className="text-[11px] opacity-50 mt-4 text-center leading-relaxed">
          Cada jugador tiene su contraseña única e intransferible.
          Quien la comparte, paga la primera ronda.
        </p>
      </form>
    </main>
  );
}
