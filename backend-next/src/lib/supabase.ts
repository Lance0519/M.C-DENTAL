import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export function supabaseAdmin() {
  try {
    const url = env.supabaseUrl();
    const key = env.supabaseServiceRoleKey();
    
    if (!url || !key) {
      throw new Error('Supabase URL or Service Role Key is missing');
    }
    
    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    throw new Error(`Supabase initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

