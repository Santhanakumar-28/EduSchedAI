
const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response;
}

