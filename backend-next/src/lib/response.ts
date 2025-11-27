import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export function success<T>(data?: T, message?: string) {
  return NextResponse.json(
    {
      success: true,
      ...(data !== undefined ? { data } : {}),
      ...(message ? { message } : {}),
    },
    { status: 200, headers: corsHeaders },
  );
}

export function error(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(extra ?? {}),
    },
    { status, headers: corsHeaders },
  );
}

export function corsOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export const responses = {
  unauthorized: (msg = 'Unauthorized') => error(msg, 401),
  forbidden: (msg = 'Access denied') => error(msg, 403),
  notFound: (msg = 'Resource not found') => error(msg, 404),
  validationError: (errors: Record<string, unknown>) =>
    error('Validation failed', 422, { errors }),
  serverError: (msg = 'Internal server error') => error(msg, 500),
};
