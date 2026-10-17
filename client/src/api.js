/**
 * Centralized API Service for EduSchedAI
 * Resolves API requests to:
 * - Local development: Relative URL (proxied by Vite to http://localhost:5050)
 * - Production: Render backend URL defined in import.meta.env.VITE_API_URL,
 *   with automatic fallback to 'https://eduschedai.onrender.com' in production mode.
 */

export const DEFAULT_BACKEND_URL = 'https://eduschedai.onrender.com';

/**
 * Normalizes and returns the base API URL.
 * Returns empty string in local development to leverage the Vite proxy.
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let cleaned = envUrl.trim().replace(/\/+$/, '');
    if (cleaned.endsWith('/api')) {
      cleaned = cleaned.slice(0, -4);
    }
    return cleaned;
  }

  // Fallback in production build or when running on a deployed host (not localhost)
  const isBrowser = typeof window !== 'undefined' && window.location;
  const isLocalhost =
    isBrowser &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '::1');

  if (import.meta.env.PROD || (isBrowser && !isLocalhost)) {
    return DEFAULT_BACKEND_URL;
  }

  return '';
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
 * Safely parses response text into JSON.
 * Prevents "Unexpected end of JSON input" errors when response body is empty (0 bytes),
 * HTML error pages (e.g. 502/503 from Render waking up, or 404), or non-2xx status.
 */
function parseJsonSafe(text, response) {
  if (!text || text.trim().length === 0) {
    return {
      success: response.ok,
      ok: response.ok,
      status: response.status,
      message: response.ok
        ? 'Success (empty response body)'
        : `Server returned empty response with HTTP ${response.status} ${response.statusText || ''}`.trim()
    };
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return {
        ok: response.ok,
        status: response.status,
        ...parsed
      };
    }
    return {
      success: response.ok,
      ok: response.ok,
      status: response.status,
      data: parsed
    };
  } catch (err) {
    // Non-JSON body (e.g. HTML error page from Render or Express)
    const cleanSnippet = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);

    return {
      success: false,
      ok: false,
      status: response.status,
      message: !response.ok
        ? `Server error (HTTP ${response.status} ${response.statusText || ''}): ${cleanSnippet || 'Invalid response'}`.trim()
        : `Unexpected non-JSON response from server: ${cleanSnippet}`,
      rawText: text
    };
  }
}

/**
 * Safely parse a fetch Response as JSON without throwing syntax errors on empty or non-JSON bodies.
 */
export async function safeResponseJson(response) {
  if (!response) {
    return {
      success: false,
      ok: false,
      status: 0,
      message: 'No response received from server'
    };
  }

  if (typeof response.safeJson === 'function') {
    return response.safeJson();
  }

  const text = await response.text();
  return parseJsonSafe(text, response);
}

/**
 * Drop-in fetch replacement that automatically routes to the production backend
 * when VITE_API_URL (or fallback) is configured, attaches JWT auth token,
 * and patches response.json() / response.safeJson() to safely handle empty or non-JSON bodies.
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

  const response = await fetch(targetUrl, {
    ...options,
    headers
  });

  // Decorate response with safe JSON parsing
  const originalText = response.text.bind(response);
  let cachedText = null;
  let cachedParsed = null;

  response.safeJson = async () => {
    if (cachedParsed !== null) return cachedParsed;
    if (cachedText === null) {
      cachedText = await originalText();
    }
    cachedParsed = parseJsonSafe(cachedText, response);
    return cachedParsed;
  };

  // Override standard response.json() so all existing callers are protected
  response.json = response.safeJson;
  response.text = async () => {
    if (cachedText !== null) return cachedText;
    cachedText = await originalText();
    return cachedText;
  };

  return response;
}

export default apiFetch;
