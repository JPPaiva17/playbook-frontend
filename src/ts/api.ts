const API_BASE_URL = 'http://localhost:8000/api';

interface AuthUser {
  id: number;
  email: string;
  username: string;
}

interface AuthTokens {
  access: string;
  refresh: string;
  user?: AuthUser;
}

interface ApiError {
  detail?: string;
  [key: string]: unknown;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

type Visibility = 'public' | 'private';

interface Play {
  id: number;
  title: string;
  description: string;
  content: string;
  visibility: Visibility;
  map: string;
  video_url: string;
  players_required: number;
  smokes: number;
  flashbangs: number;
  he_grenades: number;
  molotovs: number;
  decoys: number;
  author: string;
  created_at: string;
  updated_at: string;
}

interface Playbook {
  id: number;
  title: string;
  description: string;
  visibility: Visibility;
  plays: number[] | Play[];
  author: string;
  created_at: string;
  updated_at: string;
}

function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
  if (tokens.user) {
    localStorage.setItem('user', JSON.stringify(tokens.user));
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
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
  phone: string;
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

async function getMyPlays(): Promise<PaginatedResponse<Play>> {
  const response = await apiFetch('/plays/my/');
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function getMyPlaybooks(): Promise<PaginatedResponse<Playbook>> {
  const response = await apiFetch('/playbooks/my/');
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
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
  getStoredUser,
  getMyPlays,
  getMyPlaybooks,
  saveTokens,
  clearTokens,
};
export type { AuthUser, Play, Playbook, PaginatedResponse };
