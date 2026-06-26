import {
  createPlaybook, deletePlaybook, getMe, getMyPlaybooks, getMyPlays, getPlaybook,
  getPlays, getStoredUser, isLoggedIn, logout, updatePlaybook,
} from './api.js';
import type { Play, Playbook, PlaybookPayload } from './api.js';

if (!isLoggedIn()) window.location.href = 'login.html';

// ── Elementos estáticos ──
const errorBox       = document.getElementById('error-message')   as HTMLElement;
const playbooksList  = document.getElementById('playbooks-list')  as HTMLElement;
const welcomeText    = document.getElementById('welcome-text')    as HTMLElement;
const avatarInitials = document.getElementById('avatar-initials') as HTMLElement;
const avatarName     = document.getElementById('avatar-name')     as HTMLElement;
const dropName       = document.getElementById('drop-name')       as HTMLElement;
const dropEmail      = document.getElementById('drop-email')      as HTMLElement;
const statPlaybooks  = document.getElementById('stat-playbooks')  as HTMLElement;
const countPlaybooks = document.getElementById('count-playbooks') as HTMLElement;
const logoutButton   = document.getElementById('logout-button')   as HTMLButtonElement;
const avatarBtn      = document.getElementById('avatar-btn')      as HTMLButtonElement;
const avatarDropdown = document.getElementById('avatar-dropdown') as HTMLElement;

// ── Modal ──
const modal          = document.getElementById('playbook-modal') as HTMLElement;
const modalTitle     = document.getElementById('modal-title')    as HTMLElement;
const modalError     = document.getElementById('modal-error')    as HTMLElement;
const modalClose     = document.getElementById('modal-close')    as HTMLButtonElement;
const modalCancel    = document.getElementById('modal-cancel')   as HTMLButtonElement;
const pbForm         = document.getElementById('playbook-form')  as HTMLFormElement;
const submitButton   = document.getElementById('submit-button')  as HTMLButtonElement;
const playsChecklist = document.getElementById('plays-checklist') as HTMLElement;
const playsSearch    = document.getElementById('plays-search')   as HTMLInputElement;
const playsCount     = document.getElementById('plays-count')    as HTMLElement;
const openCreate1    = document.getElementById('open-create-modal')  as HTMLButtonElement;
const openCreate2    = document.getElementById('open-create-modal-2') as HTMLButtonElement;

// ── Dados do usuário ──
function renderUser(username: string, email: string): void {
  welcomeText.textContent    = `Olá, ${username}`;
  avatarInitials.textContent = username.slice(0, 2).toUpperCase();
  avatarName.textContent     = username;
  dropName.textContent       = username;
  dropEmail.textContent      = email;
}

const cachedUser = getStoredUser();
if (cachedUser) {
  renderUser(cachedUser.username, cachedUser.email);
} else {
  getMe().then((user) => renderUser(user.username, user.email)).catch(() => {});
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

// ── Estado do modal ──
let editingId: number | null = null;
let allPlays: Play[] = [];

const MAP_LABELS: Record<string, string> = {
  mirage: 'Mirage', inferno: 'Inferno', dust2: 'Dust 2',
  nuke: 'Nuke', overpass: 'Overpass', ancient: 'Ancient',
  anubis: 'Anubis', vertigo: 'Vertigo', train: 'Train',
};

function inp(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function refreshIcons(): void {
  (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
}

// ── Checklist de plays ──
function getCheckedIds(): number[] {
  return Array.from(playsChecklist.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'))
    .map((cb) => Number(cb.value));
}

function updatePlaysCount(): void {
  const n = getCheckedIds().length;
  playsCount.textContent = n > 0 ? String(n) : '';
}

function renderChecklist(plays: Play[], selectedIds: number[] = []): void {
  if (plays.length === 0) {
    playsChecklist.innerHTML = '<div class="plays-checklist__empty">Nenhuma play encontrada.</div>';
    return;
  }

  playsChecklist.innerHTML = plays.map((play) => {
    const checked = selectedIds.includes(play.id) ? 'checked' : '';
    const mapLabel = MAP_LABELS[play.map] ?? play.map ?? '';
    return `
    <label class="play-check-item">
      <input type="checkbox" value="${play.id}" ${checked} />
      <div class="play-check-item__info">
        <span class="play-check-item__title">${play.title}</span>
        <span class="play-check-item__meta">${mapLabel}${play.players_required ? ` · ${play.players_required}v` : ''}</span>
      </div>
    </label>`;
  }).join('');

  playsChecklist.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', updatePlaysCount);
  });

  updatePlaysCount();
}

function filterChecklist(query: string): void {
  const lower = query.toLowerCase();
  const currentIds = getCheckedIds();
  const filtered = allPlays.filter(
    (p) => p.title.toLowerCase().includes(lower) || (p.map ?? '').toLowerCase().includes(lower)
  );
  renderChecklist(filtered, currentIds);
}

playsSearch.addEventListener('input', () => filterChecklist(playsSearch.value));

// ── Carregar plays disponíveis ──
async function loadAvailablePlays(): Promise<void> {
  playsChecklist.innerHTML = '<div class="plays-checklist__loading">Carregando plays...</div>';
  try {
    const [pub, mine] = await Promise.all([getPlays(), getMyPlays()]);
    const byId = new Map<number, Play>();
    for (const p of [...pub.results, ...mine.results]) byId.set(p.id, p);
    allPlays = [...byId.values()];
    renderChecklist(allPlays);
  } catch {
    playsChecklist.innerHTML = '<div class="plays-checklist__empty">Erro ao carregar plays.</div>';
  }
}

// ── Abrir / fechar modal ──
function resetForm(): void {
  pbForm.reset();
  playsSearch.value = '';
  modalError.textContent = '';
  playsCount.textContent = '';
  editingId = null;
}

function openModal(title = 'Novo Playbook'): void {
  modalTitle.textContent = title;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  inp('pb-title').focus();
}

function closeModal(): void {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  resetForm();
}

openCreate1.addEventListener('click', async () => {
  resetForm();
  openModal();
  await loadAvailablePlays();
});
openCreate2.addEventListener('click', async () => {
  resetForm();
  openModal();
  await loadAvailablePlays();
});
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── Abrir em modo edição ──
async function openEdit(id: number): Promise<void> {
  resetForm();
  editingId = id;
  openModal('Editar Playbook');

  const [, playbook] = await Promise.all([loadAvailablePlays(), getPlaybook(id).catch(() => null)]);

  if (!playbook) {
    modalError.textContent = 'Não foi possível carregar o playbook.';
    return;
  }

  inp('pb-title').value = playbook.title;
  (document.getElementById('pb-description') as HTMLTextAreaElement).value = playbook.description;
  (document.getElementById('pb-visibility') as HTMLSelectElement).value = playbook.visibility;

  const selectedIds = playbook.plays.map((p) => (typeof p === 'number' ? p : p.id));
  renderChecklist(allPlays, selectedIds);
}

// ── Submit ──
pbForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  modalError.textContent = '';
  submitButton.disabled = true;

  const payload: PlaybookPayload = {
    title:       inp('pb-title').value,
    description: (document.getElementById('pb-description') as HTMLTextAreaElement).value,
    visibility:  (document.getElementById('pb-visibility') as HTMLSelectElement).value as 'public' | 'private',
    plays:       getCheckedIds(),
  };

  try {
    if (editingId !== null) {
      await updatePlaybook(editingId, payload);
    } else {
      await createPlaybook(payload);
    }
    closeModal();
    load();
  } catch (err) {
    modalError.textContent = err instanceof Error ? err.message : 'Não foi possível salvar o playbook.';
  } finally {
    submitButton.disabled = false;
  }
});

// ── Render playbooks ──
function renderPlaybooks(playbooks: Playbook[]): void {
  countPlaybooks.textContent = String(playbooks.length);
  statPlaybooks.textContent  = String(playbooks.length);

  if (playbooks.length === 0) {
    playbooksList.innerHTML = `
      <div class="dash-empty">
        <i data-lucide="layers"></i>
        <span>Você ainda não criou nenhum playbook.</span>
        <button class="dash-link open-create-empty" style="background:none;border:none;cursor:pointer;margin-top:0.25rem;">Criar meu primeiro playbook</button>
      </div>`;
    refreshIcons();
    playbooksList.querySelector<HTMLButtonElement>('.open-create-empty')?.addEventListener('click', async () => {
      resetForm();
      openModal();
      await loadAvailablePlays();
    });
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
        <button type="button" class="card-btn edit-pb-btn" data-id="${pb.id}"><i data-lucide="pencil"></i> Editar</button>
        <button type="button" class="card-btn danger delete-pb-btn" data-id="${pb.id}"><i data-lucide="trash-2"></i> Excluir</button>
      </div>
    </div>`;
  }).join('');

  refreshIcons();

  playbooksList.querySelectorAll<HTMLButtonElement>('.edit-pb-btn').forEach((btn) => {
    btn.addEventListener('click', () => openEdit(Number(btn.dataset.id)));
  });

  playbooksList.querySelectorAll<HTMLButtonElement>('.delete-pb-btn').forEach((btn) => {
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
