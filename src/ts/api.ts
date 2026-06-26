const API_BASE_URL = 'http://localhost:8000/api';

interface AuthUser {
  id: number;
  email: string;
  username: string;
  phone?: string;
  date_joined?: string;
}

interface ProfileUpdatePayload {
  username: string;
  email: string;
  phone: string;
}

interface PasswordChangePayload {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
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

const PLAY_MAPS: { value: string; label: string }[] = [
  { value: 'mirage', label: 'Mirage' },
  { value: 'inferno', label: 'Inferno' },
  { value: 'dust2', label: 'Dust 2' },
  { value: 'nuke', label: 'Nuke' },
  { value: 'overpass', label: 'Overpass' },
  { value: 'ancient', label: 'Ancient' },
  { value: 'anubis', label: 'Anubis' },
  { value: 'vertigo', label: 'Vertigo' },
  { value: 'train', label: 'Train' },
];

interface PlayPayload {
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
}

interface PlaybookPayload {
  title: string;
  description: string;
  visibility: Visibility;
  plays: number[];
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

function storeUser(user: AuthUser): void {
  localStorage.setItem('user', JSON.stringify(user));
}

function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) return false;

    const data = await response.json() as { access: string };
    localStorage.setItem('access_token', data.access);
    return true;
  } catch {
    return false;
  }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${getAccessToken()!}`);
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      window.location.href = 'login.html';
    }
  }

  return response;
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

async function getPlays(params: Record<string, string> = {}): Promise<PaginatedResponse<Play>> {
  const query = new URLSearchParams(params).toString();
  const response = await apiFetch(`/plays/${query ? `?${query}` : ''}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function getPlay(id: number): Promise<Play> {
  const response = await apiFetch(`/plays/${id}/`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function createPlay(payload: PlayPayload): Promise<Play> {
  const response = await apiFetch('/plays/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function updatePlay(id: number, payload: PlayPayload): Promise<Play> {
  const response = await apiFetch(`/plays/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function deletePlay(id: number): Promise<void> {
  const response = await apiFetch(`/plays/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

async function getPlaybooks(params: Record<string, string> = {}): Promise<PaginatedResponse<Playbook>> {
  const query = new URLSearchParams(params).toString();
  const response = await apiFetch(`/playbooks/${query ? `?${query}` : ''}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function getPlaybook(id: number): Promise<Playbook> {
  const response = await apiFetch(`/playbooks/${id}/`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function createPlaybook(payload: PlaybookPayload): Promise<Playbook> {
  const response = await apiFetch('/playbooks/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function updatePlaybook(id: number, payload: PlaybookPayload): Promise<Playbook> {
  const response = await apiFetch(`/playbooks/${id}/`, { method: 'PUT', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json();
}

async function deletePlaybook(id: number): Promise<void> {
  const response = await apiFetch(`/playbooks/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

async function getMe(): Promise<AuthUser> {
  const response = await apiFetch('/auth/me/');
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  const user: AuthUser = await response.json();
  storeUser(user);
  return user;
}

async function updateMe(payload: ProfileUpdatePayload): Promise<AuthUser> {
  const response = await apiFetch('/auth/me/', { method: 'PATCH', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  const user: AuthUser = await response.json();
  storeUser(user);
  return user;
}

async function changePassword(payload: PasswordChangePayload): Promise<void> {
  const response = await apiFetch('/auth/password/change/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
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
  getPlays,
  getPlay,
  createPlay,
  updatePlay,
  deletePlay,
  getPlaybooks,
  getPlaybook,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  getMe,
  updateMe,
  changePassword,
  saveTokens,
  clearTokens,
  PLAY_MAPS,
};
export type {
  AuthUser,
  Play,
  Playbook,
  PaginatedResponse,
  PlayPayload,
  PlaybookPayload,
  ProfileUpdatePayload,
  PasswordChangePayload,
};
