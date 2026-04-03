// Central API base URL — falls back to localhost:5000 in development
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Drop-in replacement for fetch() that:
 *  1. Prepends API_BASE to relative paths
 *  2. Attaches the stored JWT token as a Bearer header (when present)
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

