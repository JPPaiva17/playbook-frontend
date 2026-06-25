const API_BASE_URL = 'http://localhost:8000/api';

interface AuthTokens {
  access: string;
  refresh: string;
}

interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data: ApiError = await response.json();
    if (data.detail) return String(data.detail);
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const value = data[firstKey];
      return Array.isArray(value) ? String(value[0]) : String(value);
    }
  } catch {
    // resposta sem corpo JSON
  }
  return 'Ocorreu um erro. Tente novamente.';
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

async function register(payload: RegisterPayload): Promise<AuthTokens> {
  const response = await apiFetch('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  const tokens: AuthTokens = await response.json();
  saveTokens(tokens);
  return tokens;
}

async function login(payload: LoginPayload): Promise<AuthTokens> {
  const response = await apiFetch('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  const tokens: AuthTokens = await response.json();
  saveTokens(tokens);
  return tokens;
}

function logout(): void {
  clearTokens();
}

export {
  API_BASE_URL,
  apiFetch,
  parseErrorMessage,
  register,
  login,
  logout,
  isLoggedIn,
  getAccessToken,
  saveTokens,
  clearTokens,
};
