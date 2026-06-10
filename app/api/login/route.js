import { NextResponse } from 'next/server';
import { db, dbReady } from '@/lib/db';
import { normalizePassword, sessionCookie } from '@/lib/auth';

export async function POST(req) {
  if (!dbReady()) {
    return NextResponse.json({ error: 'La base de datos no está configurada todavía.' }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const password = normalizePassword(body.password);
  if (!password) return NextResponse.json({ error: 'Escribe tu contraseña.' }, { status: 400 });

  const { data: user } = await db()
    .from('users')
    .select('id,name,emoji')
    .eq('password', password)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: 'Contraseña incorrecta. Pregunta al capitán de la porra.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(sessionCookie(user.id));
  return res;
}
