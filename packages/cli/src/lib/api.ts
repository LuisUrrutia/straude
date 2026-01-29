import { getToken } from './config.js';

const API_URL = process.env.STRAUDE_API_URL || 'https://straude.com';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  requiresAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated. Run `straude login` first.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const { data, text } = await readResponseBody(response);
  const looksLikeHtml =
    contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');

  if (!response.ok) {
    const errorData = data as { error?: string; message?: string } | undefined;
    const errorMessage =
      (errorData && (errorData.error || errorData.message)) ||
      (looksLikeHtml
        ? 'Server returned HTML instead of JSON. Check STRAUDE_API_URL and authentication.'
        : `Request failed: ${response.status} ${response.statusText}`);
    throw new Error(errorMessage);
  }

  if (data === undefined) {
    const hint = looksLikeHtml
      ? 'Received HTML from the server. Check STRAUDE_API_URL and auth state.'
      : 'Response was not valid JSON.';
    throw new Error(`Unexpected response from server. ${hint}`);
  }

  return data as T;
}

async function readResponseBody(
  response: Response
): Promise<{ data?: unknown; text: string }> {
  const text = await response.text();
  if (!text) {
    return { text: '' };
  }
  try {
    return { data: JSON.parse(text), text };
  } catch {
    return { text };
  }
}

export interface CLIAuthInitResponse {
  code: string;
  verify_url: string;
}

export interface CLIAuthPollResponse {
  token?: string;
  status: 'pending' | 'completed' | 'expired';
  username?: string;
}

export async function initAuth(): Promise<CLIAuthInitResponse> {
  return apiRequest('/api/auth/cli/init', {
    method: 'POST',
    requiresAuth: false,
  });
}

export async function pollAuth(code: string): Promise<CLIAuthPollResponse> {
  return apiRequest('/api/auth/cli/poll', {
    method: 'POST',
    body: { code },
    requiresAuth: false,
  });
}

export interface UsageSubmitResponse {
  usage_id: string;
  post_url: string | null;
}

export async function submitUsage(data: {
  date: string;
  data: {
    date: string;
    models: string[];
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalTokens: number;
    costUSD: number;
  };
  source: 'cli';
}): Promise<UsageSubmitResponse> {
  return apiRequest('/api/usage/submit', {
    method: 'POST',
    body: data,
  });
}

export interface UserStats {
  streak: number;
  rank: number | null;
  total_spent: number;
}

export async function getStatus(): Promise<UserStats> {
  return apiRequest('/api/users/me/stats');
}
