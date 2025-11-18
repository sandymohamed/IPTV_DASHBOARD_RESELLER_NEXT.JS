import { API_BASE_URL } from '@/lib/config';
import { getServerSession } from '@/lib/auth/auth';

const baseUrl = API_BASE_URL.replace(/\/$/, '');

export class AuthFetchError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuthFetchError';
    this.status = status;
  }
}

export async function fetchWithAuth<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const session = await getServerSession();
  const apiToken = (session as any)?.apiToken;

  if (!apiToken || !session?.user) {
    throw new AuthFetchError('Your session has expired. Please sign in again.', 401);
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiToken}`,
    ...init?.headers,
  };

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${baseUrl}${normalizedPath}`, {
    ...init,
    headers: headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new AuthFetchError(bodyText || 'Failed to load data', response.status);
  }

  return response.json();
}

