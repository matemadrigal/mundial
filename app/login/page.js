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
    <main className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <div className="eyebrow mb-2">CASA DE APUESTAS PRIVADA</div>
          <h1 className="brand text-4xl leading-[0.95] mb-1">LA PORRA</h1>
          <h2 className="brand text-4xl text-yellow leading-[0.95]">WC26</h2>
          <p className="mono text-xs text-dim mt-4 tracking-widest">MEX · USA · CAN — 11 JUN / 19 JUL</p>
        </div>

        <form onSubmit={submit} className="ticket p-6">
          <label className="eyebrow block mb-2">Contraseña personal</label>
          <input
            className="input mono"
            type="password"
            inputMode="text"
            autoComplete="current-password"
            placeholder="• • • • • • • •"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error ? (
            <p className="text-sm text-live mt-3" role="alert">{error}</p>
          ) : null}
          <button className="btn-gold w-full mt-4" disabled={loading}>
            {loading ? 'Verificando…' : 'Entrar'}
          </button>
          <p className="text-[11px] text-dim mt-5 leading-relaxed">
            Acceso restringido a los 4 jugadores autorizados. Cada cuenta tiene una contraseña única.
          </p>
        </form>
      </div>
    </main>
  );
}
