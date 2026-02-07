import { NextRequest } from 'next/server';
import { success, error } from '@/lib/response';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      environment: {},
      supabase: {},
    };

    // Check environment variables
    try {
      diagnostics.environment.supabaseUrl = env.supabaseUrl() ? 'Set' : 'Missing';
    } catch (e) {
      diagnostics.environment.supabaseUrl = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
    }

    try {
      diagnostics.environment.supabaseServiceRoleKey = env.supabaseServiceRoleKey() ? 'Set' : 'Missing';
    } catch (e) {
      diagnostics.environment.supabaseServiceRoleKey = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
    }

    try {
      diagnostics.environment.clientBaseUrl = env.clientBaseUrl() ? 'Set' : 'Missing';
    } catch (e) {
      diagnostics.environment.clientBaseUrl = `Error: ${e instanceof Error ? e.message : 'Unknown'}`;
    }

    // Test Supabase connection
    try {
      const supabase = supabaseAdmin();
      const { data, error: dbErr } = await supabase.from('services').select('id').limit(1);
      
      if (dbErr) {
        diagnostics.supabase.connection = 'Failed';
        diagnostics.supabase.error = dbErr.message;
        diagnostics.supabase.code = dbErr.code;
      } else {
        diagnostics.supabase.connection = 'Success';
        diagnostics.supabase.testQuery = 'Working';
      }
    } catch (e) {
      diagnostics.supabase.connection = 'Failed';
      diagnostics.supabase.error = e instanceof Error ? e.message : 'Unknown error';
      diagnostics.supabase.stack = e instanceof Error ? e.stack : undefined;
    }

    return success(diagnostics);
  } catch (err) {
    return error('Debug endpoint failed', 500, {
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

