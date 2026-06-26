import {
  PLAY_MAPS, createPlay, deletePlay, getMyPlays, getPlay,
  getStoredUser, isLoggedIn, logout, updatePlay,
} from './api.js';
import type { Play, PlayPayload } from './api.js';

if (!isLoggedIn()) window.location.href = 'login.html';

// ── Elementos estáticos ──
const errorBox       = document.getElementById('error-message')  as HTMLElement;
const playsList      = document.getElementById('plays-list')      as HTMLElement;
const welcomeText    = document.getElementById('welcome-text')    as HTMLElement;
const avatarInitials = document.getElementById('avatar-initials') as HTMLElement;
const avatarName     = document.getElementById('avatar-name')     as HTMLElement;
const dropName       = document.getElementById('drop-name')       as HTMLElement;
const dropEmail      = document.getElementById('drop-email')      as HTMLElement;
const statPlays      = document.getElementById('stat-plays')      as HTMLElement;
const countPlays     = document.getElementById('count-plays')     as HTMLElement;
const logoutButton   = document.getElementById('logout-button')   as HTMLButtonElement;
const avatarBtn      = document.getElementById('avatar-btn')      as HTMLButtonElement;
const avatarDropdown = document.getElementById('avatar-dropdown') as HTMLElement;

// ── Modal ──
const modal        = document.getElementById('play-modal')     as HTMLElement;
const modalTitle   = document.getElementById('modal-title')    as HTMLElement;
const modalError   = document.getElementById('modal-error')    as HTMLElement;
const modalClose   = document.getElementById('modal-close')    as HTMLButtonElement;
const modalCancel  = document.getElementById('modal-cancel')   as HTMLButtonElement;
const playForm     = document.getElementById('play-form')      as HTMLFormElement;
const submitButton = document.getElementById('submit-button')  as HTMLButtonElement;
const mapSelect    = document.getElementById('map')            as HTMLSelectElement;
const openCreate1  = document.getElementById('open-create-modal')  as HTMLButtonElement;
const openCreate2  = document.getElementById('open-create-modal-2') as HTMLButtonElement;

// ── Popula select de mapas ──
for (const m of PLAY_MAPS) {
  const opt = document.createElement('option');
  opt.value = m.value;
  opt.textContent = m.label;
  mapSelect.appendChild(opt);
}

// ── Dados do usuário ──
const user = getStoredUser();
if (user) {
  welcomeText.textContent    = `Olá, ${user.username}`;
  avatarInitials.textContent = user.username.slice(0, 2).toUpperCase();
  avatarName.textContent     = user.username;
  dropName.textContent       = user.username;
  dropEmail.textContent      = user.email;
}

// ── Logout ──
logoutButton.addEventListener('click', () => { logout(); window.location.href = 'login.html'; });

// ── Avatar dropdown ──
avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = avatarDropdown.classList.toggle('open');
  avatarBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', () => {
  avatarDropdown.classList.remove('open');
  avatarBtn.setAttribute('aria-expanded', 'false');
});

// ── Modal helpers ──
let editingId: number | null = null;

function inp(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function resetForm(): void {
  playForm.reset();
  inp('players_required').value = '5';
  ['smokes', 'flashbangs', 'he_grenades', 'molotovs', 'decoys'].forEach((id) => (inp(id).value = '0'));
  modalError.textContent = '';
  editingId = null;
}

function openModal(title = 'Nova Play'): void {
  modalTitle.textContent = title;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  inp('title').focus();
}

function closeModal(): void {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  resetForm();
}

openCreate1.addEventListener('click', () => { resetForm(); openModal(); });
openCreate2.addEventListener('click', () => { resetForm(); openModal(); });
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── Abrir modal em modo edição ──
async function openEdit(id: number): Promise<void> {
  resetForm();
  editingId = id;
  openModal('Editar Play');
  try {
    const play = await getPlay(id);
    inp('title').value = play.title;
    mapSelect.value    = play.map;
    inp('description').value = play.description;
    (document.getElementById('content') as HTMLTextAreaElement).value = play.content;
    inp('video_url').value        = play.video_url;
    inp('players_required').value = String(play.players_required);
    (document.getElementById('visibility') as HTMLSelectElement).value = play.visibility;
    inp('smokes').value      = String(play.smokes);
    inp('flashbangs').value  = String(play.flashbangs);
    inp('he_grenades').value = String(play.he_grenades);
    inp('molotovs').value    = String(play.molotovs);
    inp('decoys').value      = String(play.decoys);
  } catch (err) {
    modalError.textContent = err instanceof Error ? err.message : 'Erro ao carregar play.';
  }
}

// ── Submit ──
playForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  modalError.textContent = '';
  submitButton.disabled = true;

  const payload: PlayPayload = {
    title:            inp('title').value,
    description:      inp('description').value,
    content:          (document.getElementById('content') as HTMLTextAreaElement).value,
    visibility:       (document.getElementById('visibility') as HTMLSelectElement).value as 'public' | 'private',
    map:              mapSelect.value,
    video_url:        inp('video_url').value,
    players_required: Number(inp('players_required').value),
    smokes:           Number(inp('smokes').value),
    flashbangs:       Number(inp('flashbangs').value),
    he_grenades:      Number(inp('he_grenades').value),
    molotovs:         Number(inp('molotovs').value),
    decoys:           Number(inp('decoys').value),
  };

  try {
    if (editingId !== null) {
      await updatePlay(editingId, payload);
    } else {
      await createPlay(payload);
    }
    closeModal();
    load();
  } catch (err) {
    modalError.textContent = err instanceof Error ? err.message : 'Não foi possível salvar a play.';
  } finally {
    submitButton.disabled = false;
  }
});

// ── Render ──
const MAP_LABELS: Record<string, string> = {
  mirage: 'Mirage', inferno: 'Inferno', dust2: 'Dust 2',
  nuke: 'Nuke', overpass: 'Overpass', ancient: 'Ancient',
  anubis: 'Anubis', vertigo: 'Vertigo', train: 'Train',
};

function refreshIcons(): void {
  (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
}

function renderPlays(plays: Play[]): void {
  countPlays.textContent = String(plays.length);
  statPlays.textContent  = String(plays.length);

  if (plays.length === 0) {
    playsList.innerHTML = `
      <div class="dash-empty">
        <i data-lucide="crosshair"></i>
        <span>Você ainda não criou nenhuma play.</span>
        <button class="dash-link open-create-empty" style="background:none;border:none;cursor:pointer;margin-top:0.25rem;">Criar minha primeira play</button>
      </div>`;
    refreshIcons();
    playsList.querySelector<HTMLButtonElement>('.open-create-empty')
      ?.addEventListener('click', () => { resetForm(); openModal(); });
    return;
  }

  playsList.innerHTML = plays.map((play) => {
    const mapLabel = MAP_LABELS[play.map] ?? play.map ?? 'Sem mapa';
    const isPublic = play.visibility === 'public';
    return `
    <div class="item-card" data-play-id="${play.id}">
      <div class="item-card__top">
        <span class="map-badge">${mapLabel}</span>
        <span class="vis-badge ${isPublic ? 'public' : ''}">${isPublic ? 'Pública' : 'Privada'}</span>
      </div>
      <div class="item-card__title">${play.title}</div>
      ${play.players_required ? `<div class="item-card__meta"><i data-lucide="users"></i>${play.players_required} jogadores</div>` : ''}
      <div class="item-card__actions">
        <button type="button" class="card-btn edit-play-btn" data-id="${play.id}"><i data-lucide="pencil"></i> Editar</button>
        <button type="button" class="card-btn danger delete-play-btn" data-id="${play.id}"><i data-lucide="trash-2"></i> Excluir</button>
      </div>
    </div>`;
  }).join('');

  refreshIcons();

  playsList.querySelectorAll<HTMLButtonElement>('.edit-play-btn').forEach((btn) => {
    btn.addEventListener('click', () => openEdit(Number(btn.dataset.id)));
  });

  playsList.querySelectorAll<HTMLButtonElement>('.delete-play-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir esta play?')) return;
      try {
        await deletePlay(Number(btn.dataset.id));
        load();
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível excluir a play.';
      }
    });
  });
}

async function load(): Promise<void> {
  try {
    const plays = await getMyPlays();
    renderPlays(plays.results);
  } catch {
    playsList.innerHTML = '<div class="dash-empty">Erro ao carregar plays.</div>';
  }
}

load();
