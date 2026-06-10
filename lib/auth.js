import crypto from 'crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE = 'porra_session';

function secret() {
  return process.env.SESSION_SECRET || 'dev-secret-cambiame';
}

// Normaliza contraseñas: minúsculas, sin tildes, sin espacios
export function normalizePassword(raw) {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
}

export function signToken(userId) {
  const sig = crypto.createHmac('sha256', secret()).update(String(userId)).digest('hex').slice(0, 40);
  return `${userId}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const userId = token.split('.')[0];
  return signToken(userId) === token ? Number(userId) : null;
}

export async function currentUser() {
  const token = cookies().get(COOKIE)?.value;
  const userId = verifyToken(token);
  if (!userId) return null;
  const { data } = await db().from('users').select('id,name,emoji,is_admin').eq('id', userId).maybeSingle();
  return data || null;
}

export function sessionCookie(userId) {
  return {
    name: COOKIE,
    value: signToken(userId),
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 60 // 60 días: todo el Mundial
  };
}

export const SESSION_COOKIE_NAME = COOKIE;
