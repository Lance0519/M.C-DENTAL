import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { error, success, corsOptions } from '@/lib/response';
import { createToken } from '@/lib/auth';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function OPTIONS() {
  return corsOptions();
}

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return error('Missing required fields', 400, { issues: parsed.error.flatten() });
    }

    const { username, password } = parsed.data;
    const supabase = supabaseAdmin();
    const isEmail = username.includes('@');

    const userQuery = supabase
      .from('users')
      .select('*')
      .eq(isEmail ? 'email' : 'username', username)
      .limit(1);

    const patientQuery = supabase
      .from('patients')
      .select('*')
      .eq(isEmail ? 'email' : 'username', username)
      .limit(1);

    const [{ data: users, error: userErr }, { data: patients, error: patientErr }] = await Promise.all([
      userQuery,
      patientQuery,
    ]);

    if (userErr || patientErr) {
      return error('Database error while fetching user', 500);
    }

    const user = (users?.[0] ?? patients?.[0]) as Record<string, any> | undefined;

    // Check password - users table uses 'password_hash', patients table uses 'password'
    const storedPassword = user?.password_hash || user?.password;
    if (!user || storedPassword !== password) {
      return error('Invalid username or password', 401);
    }

    const token = createToken({
      id: user.id,
      role: user.role,
      username: user.username,
      fullName: user.full_name,
    });

    const userData: Record<string, any> = {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
      fullName: user.full_name,
    };

    if (user.role === 'patient') {
      userData.phone = user.phone ?? null;
      userData.dateOfBirth = user.date_of_birth ?? null;
      userData.address = user.address ?? null;
    }

    // Log successful login
    await logAudit({
      action: 'USER_LOGIN',
      userId: user.id,
      userName: user.full_name,
      userRole: user.role,
      details: { loginMethod: isEmail ? 'email' : 'username' },
      ipAddress: getIpFromRequest(req.headers),
    });

    return success({ token, user: userData }, 'Login successful');
  } catch (err) {
    console.error('Login error', err);
    return error('Internal server error', 500);
  }
}

