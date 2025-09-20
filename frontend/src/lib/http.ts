// src/lib/http.ts
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

export async function fetchJSON<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(`${API_URL}${path}`, {
    // se usar cookie HttpOnly no backend, troque para: credentials: 'include'
    credentials: 'omit',
    mode: 'cors',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: controller.signal,
  });

  clearTimeout(id);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
  }
  return data as T;
}
