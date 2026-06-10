import { NextResponse } from 'next/server';
import { dbReady } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET() {
  if (!dbReady()) return NextResponse.json({ error: 'setup' }, { status: 503 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ user });
}
