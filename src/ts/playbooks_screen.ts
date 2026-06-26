import { deletePlaybook, getMyPlaybooks, getStoredUser, isLoggedIn, logout } from './api.js';
import type { Playbook } from './api.js';

if (!isLoggedIn()) window.location.href = 'login.html';

const errorBox       = document.getElementById('error-message')   as HTMLElement;
const playbooksList  = document.getElementById('playbooks-list')  as HTMLElement;
const welcomeText    = document.getElementById('welcome-text')     as HTMLElement;
const avatarInitials = document.getElementById('avatar-initials') as HTMLElement;
const avatarName     = document.getElementById('avatar-name')     as HTMLElement;
const dropName       = document.getElementById('drop-name')       as HTMLElement;
const dropEmail      = document.getElementById('drop-email')      as HTMLElement;
const statPlaybooks  = document.getElementById('stat-playbooks')  as HTMLElement;
const countPlaybooks = document.getElementById('count-playbooks') as HTMLElement;
const logoutButton   = document.getElementById('logout-button')   as HTMLButtonElement;
const avatarBtn      = document.getElementById('avatar-btn')      as HTMLButtonElement;
const avatarDropdown = document.getElementById('avatar-dropdown') as HTMLElement;

const user = getStoredUser();
if (user) {
  welcomeText.textContent    = `Olá, ${user.username}`;
  avatarInitials.textContent = user.username.slice(0, 2).toUpperCase();
  avatarName.textContent     = user.username;
  dropName.textContent       = user.username;
  dropEmail.textContent      = user.email;
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

function refreshIcons(): void {
  (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
}

function renderPlaybooks(playbooks: Playbook[]): void {
  countPlaybooks.textContent = String(playbooks.length);
  statPlaybooks.textContent  = String(playbooks.length);

  if (playbooks.length === 0) {
    playbooksList.innerHTML = `
      <div class="dash-empty">
        <i data-lucide="layers"></i>
        <span>Você ainda não criou nenhum playbook.</span>
        <a href="playbook_form.html">Criar meu primeiro playbook</a>
      </div>`;
    refreshIcons();
    return;
  }

  playbooksList.innerHTML = playbooks.map((pb) => {
    const isPublic   = pb.visibility === 'public';
    const playsCount = pb.plays.length;
    return `
    <div class="item-card" data-playbook-id="${pb.id}">
      <div class="item-card__top">
        <span class="map-badge" style="background:rgba(63,185,80,0.12);color:#56d364;">Playbook</span>
        <span class="vis-badge ${isPublic ? 'public' : ''}">${isPublic ? 'Público' : 'Privado'}</span>
      </div>
      <div class="item-card__title">
        <a href="playbook_detail.html?id=${pb.id}" style="color:inherit;text-decoration:none;">${pb.title}</a>
      </div>
      <div class="item-card__meta">
        <i data-lucide="crosshair"></i>${playsCount} play${playsCount !== 1 ? 's' : ''}
      </div>
      <div class="item-card__actions">
        <a href="playbook_detail.html?id=${pb.id}" class="card-btn"><i data-lucide="eye"></i> Ver</a>
        <a href="playbook_form.html?id=${pb.id}" class="card-btn"><i data-lucide="pencil"></i> Editar</a>
        <button type="button" class="card-btn danger delete-playbook-btn" data-id="${pb.id}"><i data-lucide="trash-2"></i> Excluir</button>
      </div>
    </div>`;
  }).join('');

  refreshIcons();

  playbooksList.querySelectorAll<HTMLButtonElement>('.delete-playbook-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir este playbook?')) return;
      try {
        await deletePlaybook(Number(btn.dataset.id));
        load();
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível excluir o playbook.';
      }
    });
  });
}

async function load(): Promise<void> {
  try {
    const playbooks = await getMyPlaybooks();
    renderPlaybooks(playbooks.results);
  } catch {
    playbooksList.innerHTML = '<div class="dash-empty">Erro ao carregar playbooks.</div>';
  }
}

load();
