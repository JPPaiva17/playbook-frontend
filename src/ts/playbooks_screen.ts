import { initAppbar } from './appbar.js';
import {
  createPlaybook, deletePlaybook, getMyPlaybooks, getMyPlays, getPlaybook,
  getPlays, updatePlaybook,
} from './api.js';
import type { Play, Playbook, PlaybookPayload } from './api.js';

// Injeta a appbar
initAppbar({ active: 'playbooks', createBtn: { id: 'open-create-modal', label: 'Criar Playbook' } });

// ── Elementos estáticos ──
const errorBox       = document.getElementById('error-message')   as HTMLElement;
const playbooksList  = document.getElementById('playbooks-list')  as HTMLElement;
const statPlaybooks  = document.getElementById('stat-playbooks')  as HTMLElement;
const countPlaybooks = document.getElementById('count-playbooks') as HTMLElement;

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

// ── Modal de visualização — estilo playlist ──
const pbViewModal   = document.getElementById('pb-view-modal')  as HTMLElement;
const pbViewClose   = document.getElementById('pb-view-close')  as HTMLButtonElement;
const pbCover       = document.getElementById('pb-cover')       as HTMLElement;
const pbViewTitle   = document.getElementById('pb-view-title')  as HTMLElement;
const pbViewDesc    = document.getElementById('pb-view-desc')   as HTMLElement;
const pbViewVis     = document.getElementById('pb-view-vis')    as HTMLElement;
const pbViewCount   = document.getElementById('pb-view-count')  as HTMLElement;
const pbViewAuthor  = document.getElementById('pb-view-author') as HTMLElement;
const pbViewActions = document.getElementById('pb-view-actions') as HTMLElement;
const pbTrackList   = document.getElementById('pb-track-list')  as HTMLElement;

function extractYtId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com'))
      return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? null;
  } catch { /* noop */ }
  return null;
}

function closePbViewModal(): void {
  pbViewModal.classList.remove('open');
  pbViewModal.setAttribute('aria-hidden', 'true');
}

pbViewClose.addEventListener('click', closePbViewModal);
pbViewModal.addEventListener('click', (e) => { if (e.target === pbViewModal) closePbViewModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePbViewModal(); });

function buildCover(plays: Play[]): void {
  const thumbIds = plays
    .filter((p) => p.video_url)
    .map((p) => extractYtId(p.video_url))
    .filter(Boolean)
    .slice(0, 4) as string[];

  if (thumbIds.length === 0) {
    pbCover.className = 'pb-cover';
    pbCover.innerHTML = '<div class="pb-cover__placeholder"><i data-lucide="layers"></i></div>';
    refreshIcons();
    return;
  }

  pbCover.className = `pb-cover${thumbIds.length === 1 ? ' pb-cover--single' : ''}`;
  pbCover.innerHTML = thumbIds
    .map((id) => `<img class="pb-cover__img" src="https://img.youtube.com/vi/${id}/mqdefault.jpg" alt="" />`)
    .join('');
}

function buildTrackList(plays: Play[], pbId: number): void {
  if (plays.length === 0) {
    pbTrackList.innerHTML = '<div class="pb-track-empty">Nenhuma play neste playbook.</div>';
    return;
  }

  pbTrackList.innerHTML = plays.map((play, i) => {
    const ytId    = extractYtId(play.video_url ?? '');
    const mapLabel = MAP_LABELS[play.map] ?? play.map ?? '—';
    const thumbHtml = ytId
      ? `<img src="https://img.youtube.com/vi/${ytId}/default.jpg" alt="" />`
      : `<div class="pb-track__thumb-placeholder"><i data-lucide="crosshair"></i></div>`;
    const ytBtn = ytId
      ? `<a class="pb-track__yt-btn" href="${play.video_url}" target="_blank" rel="noopener" title="Abrir no YouTube">
           <i data-lucide="youtube"></i>
         </a>`
      : '';
    return `
    <div class="pb-track" data-play-id="${play.id}">
      <div class="pb-track__num">
        <span>${i + 1}</span>
        ${ytBtn}
      </div>
      <div class="pb-track__info">
        <div class="pb-track__thumb-wrap">${thumbHtml}</div>
        <div class="pb-track__text">
          <span class="pb-track__title">${play.title}</span>
          <span class="pb-track__author">${play.author}</span>
        </div>
      </div>
      <div class="pb-track__map">
        ${play.map ? `<span class="map-badge">${mapLabel}</span>` : '<span style="color:#8b949e;font-size:0.8rem;">—</span>'}
      </div>
      <div class="pb-track__players">${play.players_required ?? '—'}</div>
    </div>`;
  }).join('');

  refreshIcons();
}

// ── Modal de visualização de play (a partir do playbook) ──
const pbPlayModal      = document.getElementById('pb-play-view-modal')  as HTMLElement;
const pbPlayBack       = document.getElementById('pb-play-back')         as HTMLButtonElement;
const pbPlayBackFooter = document.getElementById('pb-play-back-footer')  as HTMLButtonElement;
const pbPlayClose      = document.getElementById('pb-play-close')        as HTMLButtonElement;
const pbPlayTitle      = document.getElementById('pb-play-title')        as HTMLElement;
const pbPlayMapBadge   = document.getElementById('pb-play-map-badge')    as HTMLElement;
const pbPlayVisBadge   = document.getElementById('pb-play-vis-badge')    as HTMLElement;
const pbPlayThumb      = document.getElementById('pb-play-thumb')        as HTMLElement;
const pbPlayYtLink     = document.getElementById('pb-play-yt-link')      as HTMLAnchorElement;
const pbPlayDesc       = document.getElementById('pb-play-description')  as HTMLElement;
const pbPlayContent    = document.getElementById('pb-play-content')      as HTMLElement;
const pbPlayMapText    = document.getElementById('pb-play-map-text')     as HTMLElement;
const pbPlayVisText    = document.getElementById('pb-play-vis-text')     as HTMLElement;
const pbPlayPlayers    = document.getElementById('pb-play-players')      as HTMLElement;
const pbPlaySmokes     = document.getElementById('pb-play-smokes')       as HTMLElement;
const pbPlayFlash      = document.getElementById('pb-play-flashbangs')   as HTMLElement;
const pbPlayHe         = document.getElementById('pb-play-he')           as HTMLElement;
const pbPlayMolotovs   = document.getElementById('pb-play-molotovs')    as HTMLElement;

document.querySelectorAll<HTMLButtonElement>('.pb-play-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pb-play-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll<HTMLElement>('[id^="pb-ptab-"]').forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(`pb-ptab-${tab.dataset.ptab}`)?.classList.remove('hidden');
  });
});

function closePbPlayModal(): void {
  pbPlayModal.classList.remove('open');
  pbPlayModal.setAttribute('aria-hidden', 'true');
  pbPlayThumb.querySelector('iframe')?.remove();
}

function closeAllModals(): void {
  closePbPlayModal();
  closePbViewModal();
}

pbPlayBack.addEventListener('click', closePbPlayModal);
pbPlayBackFooter.addEventListener('click', closePbPlayModal);
pbPlayClose.addEventListener('click', closeAllModals);
pbPlayModal.addEventListener('click', (e) => { if (e.target === pbPlayModal) closePbPlayModal(); });

function openPlayFromPlaybook(play: Play): void {
  // Reseta tabs
  document.querySelectorAll('.pb-play-tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll<HTMLElement>('[id^="pb-ptab-"]').forEach((p) => p.classList.add('hidden'));
  document.querySelector<HTMLElement>('.pb-play-tab[data-ptab="desc"]')?.classList.add('active');
  document.getElementById('pb-ptab-desc')?.classList.remove('hidden');

  pbPlayTitle.textContent    = play.title;
  pbPlayDesc.textContent     = play.description || '';
  pbPlayContent.textContent  = play.content;
  pbPlayPlayers.textContent  = String(play.players_required);
  pbPlaySmokes.textContent   = String(play.smokes);
  pbPlayFlash.textContent    = String(play.flashbangs);
  pbPlayHe.textContent       = String(play.he_grenades);
  pbPlayMolotovs.textContent = String(play.molotovs);

  const mapLabel = MAP_LABELS[play.map] ?? play.map ?? '';
  if (mapLabel) {
    pbPlayMapBadge.textContent  = mapLabel;
    pbPlayMapBadge.style.display = '';
    pbPlayMapText.textContent   = mapLabel;
  } else {
    pbPlayMapBadge.style.display = 'none';
    pbPlayMapText.textContent   = '—';
  }

  const isPublic = play.visibility === 'public';
  pbPlayVisBadge.textContent = isPublic ? 'Pública' : 'Privada';
  pbPlayVisBadge.className   = `vis-badge${isPublic ? ' public' : ''}`;
  pbPlayVisText.textContent  = isPublic ? 'Pública' : 'Privada';

  const ytId = extractYtId(play.video_url ?? '');
  if (ytId) {
    pbPlayThumb.innerHTML = `<iframe class="yt-embed"
      src="https://www.youtube.com/embed/${ytId}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>`;
    pbPlayYtLink.href          = play.video_url!;
    pbPlayYtLink.style.display = 'flex';
  } else {
    pbPlayThumb.innerHTML = `<div class="play-thumb__placeholder"><i data-lucide="youtube"></i><span>Sem vídeo</span></div>`;
    pbPlayYtLink.style.display = 'none';
    refreshIcons();
  }

  pbPlayModal.classList.add('open');
  pbPlayModal.setAttribute('aria-hidden', 'false');
}

async function openViewPlaybook(id: number): Promise<void> {
  pbViewTitle.textContent  = 'Carregando...';
  pbViewDesc.textContent   = '';
  pbViewCount.textContent  = '';
  pbViewAuthor.textContent = '—';
  pbViewActions.innerHTML  = '';
  pbTrackList.innerHTML    = '<div class="plays-checklist__loading">Carregando plays...</div>';
  pbCover.className        = 'pb-cover';
  pbCover.innerHTML        = '<div class="pb-cover__placeholder"><i data-lucide="layers"></i></div>';
  refreshIcons();

  pbViewModal.classList.add('open');
  pbViewModal.setAttribute('aria-hidden', 'false');

  try {
    const pb    = await getPlaybook(id);
    const plays = (pb.plays as Play[]);

    pbViewTitle.textContent  = pb.title;
    pbViewDesc.textContent   = pb.description || '';
    pbViewAuthor.textContent = pb.author;

    const isPublic = pb.visibility === 'public';
    pbViewVis.textContent = isPublic ? 'Público' : 'Privado';
    pbViewVis.className   = `vis-badge${isPublic ? ' public' : ''}`;
    pbViewCount.textContent = `${plays.length} play${plays.length !== 1 ? 's' : ''}`;

    pbViewActions.innerHTML = `
      <button class="card-btn pb-view-edit-btn" data-id="${pb.id}"><i data-lucide="pencil"></i> Editar</button>
      <button class="card-btn danger pb-view-delete-btn" data-id="${pb.id}"><i data-lucide="trash-2"></i> Excluir</button>`;
    refreshIcons();

    pbViewActions.querySelector<HTMLButtonElement>('.pb-view-edit-btn')?.addEventListener('click', () => {
      closePbViewModal();
      openEdit(id);
    });

    pbViewActions.querySelector<HTMLButtonElement>('.pb-view-delete-btn')?.addEventListener('click', async () => {
      if (!confirm('Excluir este playbook?')) return;
      try {
        await deletePlaybook(id);
        closePbViewModal();
        load();
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível excluir.';
      }
    });

    buildCover(plays);
    buildTrackList(plays, id);

    // Clique na track abre modal da play por cima
    pbTrackList.querySelectorAll<HTMLElement>('.pb-track').forEach((row) => {
      row.style.cursor = 'pointer';
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.pb-track__yt-btn')) return;
        const play = plays.find((p) => p.id === Number(row.dataset.playId));
        if (play) openPlayFromPlaybook(play);
      });
    });
  } catch {
    pbViewTitle.textContent = 'Erro ao carregar playbook.';
    pbTrackList.innerHTML   = '';
  }
}

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
    <div class="item-card" data-playbook-id="${pb.id}" style="cursor:pointer;">
      <div class="item-card__top">
        <span class="map-badge" style="background:rgba(63,185,80,0.12);color:#56d364;">Playbook</span>
        <span class="vis-badge ${isPublic ? 'public' : ''}">${isPublic ? 'Público' : 'Privado'}</span>
      </div>
      <div class="item-card__title">${pb.title}</div>
      <div class="item-card__meta">
        <i data-lucide="crosshair"></i>${playsCount} play${playsCount !== 1 ? 's' : ''}
      </div>
      <div class="item-card__actions">
        <button type="button" class="card-btn edit-pb-btn" data-id="${pb.id}"><i data-lucide="pencil"></i> Editar</button>
        <button type="button" class="card-btn danger delete-pb-btn" data-id="${pb.id}"><i data-lucide="trash-2"></i> Excluir</button>
      </div>
    </div>`;
  }).join('');

  refreshIcons();

  playbooksList.querySelectorAll<HTMLElement>('.item-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.item-card__actions')) return;
      openViewPlaybook(Number(card.dataset.playbookId));
    });
  });

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
