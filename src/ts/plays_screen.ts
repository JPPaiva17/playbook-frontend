import { deletePlay, getMyPlays, getStoredUser, isLoggedIn, logout } from './api.js';
import type { Play } from './api.js';

if (!isLoggedIn()) window.location.href = 'login.html';

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

const user = getStoredUser();
if (user) {
  welcomeText.textContent  = `Olá, ${user.username}`;
  avatarInitials.textContent = user.username.slice(0, 2).toUpperCase();
  avatarName.textContent   = user.username;
  dropName.textContent     = user.username;
  dropEmail.textContent    = user.email;
}

logoutButton.addEventListener('click', () => {
  logout();
  window.location.href = 'login.html';
});

avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = avatarDropdown.classList.toggle('open');
  avatarBtn.setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', () => {
  avatarDropdown.classList.remove('open');
  avatarBtn.setAttribute('aria-expanded', 'false');
});

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
        <a href="play_form.html">Criar minha primeira play</a>
      </div>`;
    refreshIcons();
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
        <a href="play_form.html?id=${play.id}" class="card-btn"><i data-lucide="pencil"></i> Editar</a>
        <button type="button" class="card-btn danger delete-play-btn" data-id="${play.id}"><i data-lucide="trash-2"></i> Excluir</button>
      </div>
    </div>`;
  }).join('');

  refreshIcons();

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
