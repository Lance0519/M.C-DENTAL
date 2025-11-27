import jwt from 'jsonwebtoken';
import { env } from './env';
import { responses } from './response';
import { NextRequest } from 'next/server';

export type AuthPayload = {
  id: string;
  role: 'admin' | 'staff' | 'patient';
  [key: string]: unknown;
};

function getToken(req: NextRequest) {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  return header.replace('Bearer ', '').trim();
}

export function authenticate(req: NextRequest): AuthPayload | Response {
  const token = getToken(req);
  if (!token) {
    return responses.unauthorized('No token provided');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret()) as AuthPayload;
    return payload;
  } catch (err) {
    return responses.unauthorized('Invalid token');
  }
}

export function requireRole(req: NextRequest, ...roles: AuthPayload['role'][]): AuthPayload | Response {
  const auth = authenticate(req);
  if (auth instanceof Response) {
    return auth;
  }

  if (!roles.includes(auth.role)) {
    return responses.forbidden(`Access denied. Required role: ${roles.join(' or ')}`);
  }

  return auth;
}

export function createToken(payload: AuthPayload, expiresIn = '24h') {
  return jwt.sign(payload, env.jwtSecret(), { expiresIn });
}

