import {
  PLAY_MAPS, createPlay, deletePlay, getMe, getMyPlays, getPlay,
  getStoredUser, isLoggedIn, logout, updatePlay,
} from './api.js';
import type { Play, PlayPayload } from './api.js';

if (!isLoggedIn()) window.location.href = 'login.html';

// ── Elementos estáticos ──
const errorBox       = document.getElementById('error-message')  as HTMLElement;
const playsList      = document.getElementById('plays-list')      as HTMLElement;
const avatarInitials = document.getElementById('avatar-initials') as HTMLElement;
const avatarName     = document.getElementById('avatar-name')     as HTMLElement;
const dropName       = document.getElementById('drop-name')       as HTMLElement;
const dropEmail      = document.getElementById('drop-email')      as HTMLElement;
const countPlays     = document.getElementById('count-plays')     as HTMLElement;
const logoutButton   = document.getElementById('logout-button')   as HTMLButtonElement;
const avatarBtn      = document.getElementById('avatar-btn')      as HTMLButtonElement;
const avatarDropdown = document.getElementById('avatar-dropdown') as HTMLElement;

// ── Search & Filter ──
const searchInput   = document.getElementById('search-input')   as HTMLInputElement;
const filterBtn     = document.getElementById('filter-btn')     as HTMLButtonElement;
const filterDropdown= document.getElementById('filter-dropdown') as HTMLElement;
const filterMap     = document.getElementById('filter-map')     as HTMLSelectElement;
const filterClear   = document.getElementById('filter-clear')   as HTMLButtonElement;
const filterApply   = document.getElementById('filter-apply')   as HTMLButtonElement;

// ── Modal ──
const modal        = document.getElementById('play-modal')     as HTMLElement;
const modalTitle   = document.getElementById('modal-title')    as HTMLElement;
const modalError   = document.getElementById('modal-error')    as HTMLElement;
const modalClose   = document.getElementById('modal-close')    as HTMLButtonElement;
const modalCancel  = document.getElementById('modal-cancel')   as HTMLButtonElement;
const playForm     = document.getElementById('play-form')      as HTMLFormElement;
const submitButton = document.getElementById('submit-button')  as HTMLButtonElement;
const mapSelect    = document.getElementById('map')            as HTMLSelectElement;
const thumbEl      = document.getElementById('play-thumb')     as HTMLElement;
const openCreate1  = document.getElementById('open-create-modal')   as HTMLButtonElement;
const openCreate2  = document.getElementById('open-create-modal-2') as HTMLButtonElement;

// ── Popula selects de mapas ──
for (const m of PLAY_MAPS) {
  for (const sel of [mapSelect, filterMap]) {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    sel.appendChild(opt);
  }
}

// ── Dados do usuário ──
function renderUser(username: string, email: string): void {
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

// ── Filter dropdown ──
filterBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = filterDropdown.classList.toggle('open');
  filterBtn.classList.toggle('active', open);
});

document.addEventListener('click', () => {
  avatarDropdown.classList.remove('open');
  avatarBtn.setAttribute('aria-expanded', 'false');
  filterDropdown.classList.remove('open');
  filterBtn.classList.remove('active');
});

filterDropdown.addEventListener('click', (e) => e.stopPropagation());

// ── Estado dos filtros ──
let allPlays: Play[] = [];
let activeFilters = { map: '', smokes: false, flash: false, he: false, molotov: false };

function getGrenadeCheckbox(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

filterApply.addEventListener('click', () => {
  activeFilters = {
    map:     filterMap.value,
    smokes:  getGrenadeCheckbox('f-smokes').checked,
    flash:   getGrenadeCheckbox('f-flash').checked,
    he:      getGrenadeCheckbox('f-he').checked,
    molotov: getGrenadeCheckbox('f-molotov').checked,
  };
  filterDropdown.classList.remove('open');
  filterBtn.classList.remove('active');
  renderFiltered();
});

filterClear.addEventListener('click', () => {
  filterMap.value = '';
  getGrenadeCheckbox('f-smokes').checked  = false;
  getGrenadeCheckbox('f-flash').checked   = false;
  getGrenadeCheckbox('f-he').checked      = false;
  getGrenadeCheckbox('f-molotov').checked = false;
  activeFilters = { map: '', smokes: false, flash: false, he: false, molotov: false };
  filterDropdown.classList.remove('open');
  filterBtn.classList.remove('active');
  renderFiltered();
});

searchInput.addEventListener('input', renderFiltered);

function applyFilters(plays: Play[]): Play[] {
  const q = searchInput.value.toLowerCase().trim();
  return plays.filter((p) => {
    if (q && !p.title.toLowerCase().includes(q)) return false;
    if (activeFilters.map && p.map !== activeFilters.map) return false;
    if (activeFilters.smokes  && !p.smokes)     return false;
    if (activeFilters.flash   && !p.flashbangs) return false;
    if (activeFilters.he      && !p.he_grenades)return false;
    if (activeFilters.molotov && !p.molotovs)   return false;
    return true;
  });
}

function renderFiltered(): void {
  renderPlays(applyFilters(allPlays));
}

// ── YouTube thumbnail ──
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com'))
      return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? null;
  } catch { /* URL inválida */ }
  return null;
}

function updateThumb(url: string): void {
  const id = extractYouTubeId(url);
  if (id) {
    thumbEl.innerHTML = `<img src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="Thumbnail" />`;
  } else {
    thumbEl.innerHTML = `
      <div class="play-thumb__placeholder">
        <i data-lucide="youtube"></i>
        <span>Thumbnail do vídeo</span>
      </div>`;
    refreshIcons();
  }
}

document.getElementById('video_url')?.addEventListener('input', (e) => {
  updateThumb((e.target as HTMLInputElement).value);
});

// ── Tabs ──
document.querySelectorAll<HTMLButtonElement>('.modal__tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal__tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.modal__tab-panel').forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`)?.classList.remove('hidden');
  });
});

// ── Modal helpers ──
let editingId: number | null = null;

function inp(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function resetForm(): void {
  playForm.reset();
  inp('players_required').value = '5';
  ['smokes', 'flashbangs', 'he_grenades', 'molotovs'].forEach((id) => (inp(id).value = '0'));
  modalError.textContent = '';
  editingId = null;
  updateThumb('');
  document.querySelectorAll('.modal__tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.modal__tab-panel').forEach((p) => p.classList.add('hidden'));
  document.querySelector<HTMLElement>('.modal__tab[data-tab="desc"]')?.classList.add('active');
  document.getElementById('tab-desc')?.classList.remove('hidden');
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

// ── Modal de visualização (read-only) ──
const viewModal       = document.getElementById('view-modal')        as HTMLElement;
const viewModalClose  = document.getElementById('view-modal-close')  as HTMLButtonElement;
const viewModalCancel = document.getElementById('view-modal-cancel') as HTMLButtonElement;
const viewTitle       = document.getElementById('view-modal-title')  as HTMLElement;
const viewMapBadge    = document.getElementById('view-map-badge')    as HTMLElement;
const viewVisBadge    = document.getElementById('view-vis-badge')    as HTMLElement;
const viewThumb       = document.getElementById('view-thumb')        as HTMLElement;
const viewYtLink      = document.getElementById('view-yt-link')      as HTMLAnchorElement;
const viewDescription = document.getElementById('view-description')  as HTMLElement;
const viewContent     = document.getElementById('view-content')      as HTMLElement;
const viewMapText     = document.getElementById('view-map-text')     as HTMLElement;
const viewVisText     = document.getElementById('view-visibility-text') as HTMLElement;
const viewPlayers     = document.getElementById('view-players')      as HTMLElement;
const viewSmokes      = document.getElementById('view-smokes')       as HTMLElement;
const viewFlashbangs  = document.getElementById('view-flashbangs')   as HTMLElement;
const viewHe          = document.getElementById('view-he')           as HTMLElement;
const viewMolotovs    = document.getElementById('view-molotovs')     as HTMLElement;

document.querySelectorAll<HTMLButtonElement>('.view-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.view-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll<HTMLElement>('[id^="vtab-"]').forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`vtab-${tab.dataset.vtab}`)?.classList.remove('hidden');
  });
});

function closeViewModal(): void {
  viewModal.classList.remove('open');
  viewModal.setAttribute('aria-hidden', 'true');
  // Remove iframe para parar o vídeo
  viewThumb.querySelector('iframe')?.remove();
}

viewModalClose.addEventListener('click', closeViewModal);
viewModalCancel.addEventListener('click', closeViewModal);
viewModal.addEventListener('click', (e) => { if (e.target === viewModal) closeViewModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewModal(); });

async function openView(id: number): Promise<void> {
  // Reseta aba para Descrição
  document.querySelectorAll('.view-tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll<HTMLElement>('[id^="vtab-"]').forEach((p) => p.classList.add('hidden'));
  document.querySelector<HTMLElement>('.view-tab[data-vtab="desc"]')?.classList.add('active');
  document.getElementById('vtab-desc')?.classList.remove('hidden');

  viewTitle.textContent       = 'Carregando...';
  viewMapBadge.style.display  = 'none';
  viewYtLink.style.display    = 'none';
  viewThumb.innerHTML         = `<div class="play-thumb__placeholder"><i data-lucide="youtube"></i><span>Sem vídeo</span></div>`;
  refreshIcons();

  viewModal.classList.add('open');
  viewModal.setAttribute('aria-hidden', 'false');

  try {
    const play = await getPlay(id);

    viewTitle.textContent     = play.title;
    viewDescription.textContent = play.description || '';
    viewContent.textContent   = play.content;
    viewPlayers.textContent   = String(play.players_required);
    viewSmokes.textContent    = String(play.smokes);
    viewFlashbangs.textContent = String(play.flashbangs);
    viewHe.textContent        = String(play.he_grenades);
    viewMolotovs.textContent  = String(play.molotovs);

    // Mapa
    const mapLabel = MAP_LABELS[play.map] ?? play.map ?? '';
    if (mapLabel) {
      viewMapBadge.textContent  = mapLabel;
      viewMapBadge.style.display = '';
      viewMapText.textContent   = mapLabel;
    } else {
      viewMapBadge.style.display = 'none';
      viewMapText.textContent   = '—';
    }

    // Visibilidade
    const isPublic = play.visibility === 'public';
    viewVisBadge.textContent  = isPublic ? 'Pública' : 'Privada';
    viewVisBadge.className    = `vis-badge${isPublic ? ' public' : ''}`;
    viewVisText.textContent   = isPublic ? 'Pública' : 'Privada';

    // Vídeo
    const ytId = extractYouTubeId(play.video_url ?? '');
    if (ytId) {
      viewThumb.innerHTML = `<iframe class="yt-embed"
        src="https://www.youtube.com/embed/${ytId}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
      viewYtLink.href           = play.video_url!;
      viewYtLink.style.display  = 'flex';
    } else {
      viewThumb.innerHTML = `<div class="play-thumb__placeholder"><i data-lucide="youtube"></i><span>Sem vídeo</span></div>`;
      viewYtLink.style.display  = 'none';
      refreshIcons();
    }
  } catch {
    viewTitle.textContent = 'Erro ao carregar play.';
  }
}

// ── Abrir em modo edição ──
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
    if (play.video_url) updateThumb(play.video_url);
  } catch (err) {
    modalError.textContent = err instanceof Error ? err.message : 'Erro ao carregar play.';
  }
}

// ── Submit ──
playForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  modalError.textContent = '';

  const content = (document.getElementById('content') as HTMLTextAreaElement).value.trim();
  if (!content) {
    document.querySelectorAll('.modal__tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.modal__tab-panel').forEach((p) => p.classList.add('hidden'));
    document.querySelector<HTMLElement>('.modal__tab[data-tab="desc"]')?.classList.add('active');
    document.getElementById('tab-desc')?.classList.remove('hidden');
    modalError.textContent = 'O campo "Passo a passo" é obrigatório.';
    (document.getElementById('content') as HTMLTextAreaElement).focus();
    return;
  }

  submitButton.disabled = true;

  const payload: PlayPayload = {
    title:            inp('title').value,
    description:      inp('description').value,
    content,
    visibility:       (document.getElementById('visibility') as HTMLSelectElement).value as 'public' | 'private',
    map:              mapSelect.value,
    video_url:        inp('video_url').value,
    players_required: Number(inp('players_required').value),
    smokes:           Number(inp('smokes').value),
    flashbangs:       Number(inp('flashbangs').value),
    he_grenades:      Number(inp('he_grenades').value),
    molotovs:         Number(inp('molotovs').value),
    decoys:           0,
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

  if (plays.length === 0) {
    playsList.innerHTML = `
      <div class="dash-empty">
        <i data-lucide="crosshair"></i>
        <span>Nenhuma play encontrada.</span>
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
    const thumbId  = extractYouTubeId(play.video_url ?? '');
    const thumbHtml = thumbId
      ? `<img class="item-card__thumb" src="https://img.youtube.com/vi/${thumbId}/mqdefault.jpg" alt="" />`
      : '';
    return `
    <div class="item-card" data-play-id="${play.id}">
      ${thumbHtml}
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

  playsList.querySelectorAll<HTMLElement>('.item-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.item-card__actions')) return;
      openView(Number(card.dataset.playId));
    });
  });

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
    const data = await getMyPlays();
    allPlays = data.results;
    renderFiltered();
  } catch {
    playsList.innerHTML = '<div class="dash-empty">Erro ao carregar plays.</div>';
  }
}

load();
