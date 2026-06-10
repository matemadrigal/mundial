import { createClient } from '@supabase/supabase-js';

let _client = null;

export function dbReady() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

export function db() {
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });
  }
  return _client;
}

export async function getSetting(key) {
  const { data } = await db().from('settings').select('value').eq('key', key).maybeSingle();
  return data ? data.value : null;
}

export async function setSetting(key, value) {
  await db().from('settings').upsert({ key, value });
}
