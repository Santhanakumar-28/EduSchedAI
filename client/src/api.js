/**
 * Centralized API Service for EduSchedAI
 * Resolves API requests to:
 * - Local development: Relative URL (proxied by Vite to http://localhost:5050)
 * - Production: Render backend URL defined in import.meta.env.VITE_API_URL
 */

/**
 * Normalizes and returns the base API URL.
 * Returns empty string in development to leverage the Vite proxy.
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string') {
    return '';
  }

  // Trim whitespace and remove trailing slashes
  let cleaned = envUrl.trim().replace(/\/+$/, '');

  // Strip duplicate trailing /api if the user provided it in VITE_API_URL
  if (cleaned.endsWith('/api')) {
    cleaned = cleaned.slice(0, -4);
  }

  return cleaned;
}

/**
 * Builds the full target API URL for an endpoint, avoiding duplicate `/api` prefixes.
 * Examples:
 *   apiUrl('/api/dataset') in dev  -> '/api/dataset'
 *   apiUrl('/api/dataset') in prod -> 'https://eduschedai.onrender.com/api/dataset'
 *   apiUrl('/api/export/csv') in prod -> 'https://eduschedai.onrender.com/api/export/csv'
 */
export function apiUrl(endpoint = '') {
  if (!endpoint) return getApiBaseUrl();

  // If already an absolute HTTP/HTTPS URL, return as-is
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return base ? `${base}${path}` : path;
}

/**
 * Drop-in fetch replacement that automatically routes to the production backend
 * when VITE_API_URL is configured, and attaches the JWT authentication token if available.
 *
 * @param {string} endpoint - API path (e.g. '/api/auth/login' or '/api/dataset')
 * @param {RequestInit} options - Standard fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const targetUrl = apiUrl(endpoint);

  // Safely clone headers
  let headers = options.headers;
  const token = localStorage.getItem('edusched_token');

  if (headers instanceof Headers) {
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } else {
    headers = { ...(headers || {}) };
    const hasAuth = Object.keys(headers).some(
      (key) => key.toLowerCase() === 'authorization'
    );
    if (token && !hasAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return fetch(targetUrl, {
    ...options,
    headers
  });
}

export default apiFetch;
