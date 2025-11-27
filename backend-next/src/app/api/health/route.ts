import { NextRequest } from 'next/server';
import { success } from '@/lib/response';

export function GET(_req: NextRequest) {
  return success({ status: 'ok' });
}

