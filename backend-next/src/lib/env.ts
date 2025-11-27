const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_PASSWORD',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM_ADDRESS',
  'CLIENT_BASE_URL',
] as const;

type RequiredEnv = (typeof required)[number];

const cache: Partial<Record<RequiredEnv, string>> = {};

export function getEnv(name: RequiredEnv): string {
  if (cache[name]) {
    return cache[name] as string;
  }

  // Get value and trim any whitespace/BOM characters
  let value = process.env[name];
  
  if (value) {
    // Remove BOM and trim whitespace
    value = value.replace(/^\uFEFF/, '').trim();
  }

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  cache[name] = value;
  return value;
}

export const env = {
  supabaseUrl: () => getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseServiceRoleKey: () => getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseDbPassword: () => getEnv('SUPABASE_DB_PASSWORD'),
  jwtSecret: () => getEnv('JWT_SECRET'),
  resendApiKey: () => getEnv('RESEND_API_KEY'),
  emailFromAddress: () => getEnv('EMAIL_FROM_ADDRESS'),
  clientBaseUrl: () => getEnv('CLIENT_BASE_URL'),
};

