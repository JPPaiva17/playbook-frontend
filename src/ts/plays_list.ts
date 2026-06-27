import { initAppbar } from './appbar.js';
import { PLAY_MAPS, getPlay, getPlaybook, getPlaybooks, getPlays } from './api.js';
import type { Play, Playbook } from './api.js';

initAppbar({ active: 'explore' });

// ── Elementos ──
const errorBox       = document.getElementById('error-message')  as HTMLElement;
const exploreGrid    = document.getElementById('explore-grid')   as HTMLElement;
const resultCount    = document.getElementById('result-count')   as HTMLElement;
const searchInput    = document.getElementById('search-input')   as HTMLInputElement;
const filterBtn      = document.getElementById('filter-btn')     as HTMLButtonElement;
const filterDropdown = document.getElementById('filter-dropdown') as HTMLElement;
const filterMap      = document.getElementById('filter-map')     as HTMLSelectElement;
const filterWrapper  = document.getElementById('filter-wrapper') as HTMLElement;
const filterClear    = document.getElementById('filter-clear')   as HTMLButtonElement;
const filterApply    = document.getElementById('filter-apply')   as HTMLButtonElement;
const tabPlays       = document.getElementById('tab-plays')      as HTMLButtonElement;
const tabPlaybooks   = document.getElementById('tab-playbooks')  as HTMLButtonElement;

// ── Play view modal ──
const playViewModal  = document.getElementById('play-view-modal') as HTMLElement;
const pvClose        = document.getElementById('pv-close')        as HTMLButtonElement;
const pvTitle        = document.getElementById('pv-title')        as HTMLElement;
const pvThumb        = document.getElementById('pv-thumb')        as HTMLElement;
const pvYtLink       = document.getElementById('pv-yt-link')      as HTMLAnchorElement;
const pvMap          = document.getElementById('pv-map')          as HTMLElement;
const pvVis          = document.getElementById('pv-vis')          as HTMLElement;
const pvAuthor       = document.getElementById('pv-author')       as HTMLElement;
const pvDescription  = document.getElementById('pv-description')  as HTMLElement;
const pvContent      = document.getElementById('pv-content')      as HTMLElement;
const pvInfoMap      = document.getElementById('pv-info-map')     as HTMLElement;
const pvInfoPlayers  = document.getElementById('pv-info-players') as HTMLElement;
const pvInfoSmokes   = document.getElementById('pv-info-smokes')  as HTMLElement;
const pvInfoFlash    = document.getElementById('pv-info-flash')   as HTMLElement;
const pvInfoHe       = document.getElementById('pv-info-he')      as HTMLElement;
const pvInfoMolotov  = document.getElementById('pv-info-molotov') as HTMLElement;

// ── Playbook view modal ──
const pbViewModal    = document.getElementById('pb-view-modal')  as HTMLElement;
const pbvClose       = document.getElementById('pbv-close')      as HTMLButtonElement;
const pbvTitle       = document.getElementById('pbv-title')      as HTMLElement;
const pbvMeta        = document.getElementById('pbv-meta')       as HTMLElement;
const pbvDescription = document.getElementById('pbv-description') as HTMLElement;
const pbvTracks      = document.getElementById('pbv-tracks')     as HTMLElement;

// ── Popula select de mapas ──
for (const m of PLAY_MAPS) {
  const opt = document.createElement('option');
  opt.value = m.value;
  opt.textContent = m.label;
  filterMap.appendChild(opt);
}

// ── Filter dropdown ──
filterBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = filterDropdown.classList.toggle('open');
  filterBtn.classList.toggle('active', open);
});
filterDropdown.addEventListener('click', (e) => e.stopPropagation());
document.addEventListener('click', () => {
  filterDropdown.classList.remove('open');
  filterBtn.classList.remove('active');
});

// ── Estado ──
type Mode = 'plays' | 'playbooks';
let mode: Mode = 'plays';
let allPlays: Play[] = [];
let allPlaybooks: Playbook[] = [];
let activeFilters = { map: '', smokes: false, flash: false, he: false, molotov: false };

function gc(id: string): HTMLInputElement { return document.getElementById(id) as HTMLInputElement; }

filterApply.addEventListener('click', () => {
  activeFilters = {
    map:     filterMap.value,
    smokes:  gc('f-smokes').checked,
    flash:   gc('f-flash').checked,
    he:      gc('f-he').checked,
    molotov: gc('f-molotov').checked,
  };
  filterDropdown.classList.remove('open');
  filterBtn.classList.remove('active');
  renderFiltered();
});

filterClear.addEventListener('click', () => {
  filterMap.value = '';
  ['f-smokes','f-flash','f-he','f-molotov'].forEach(id => gc(id).checked = false);
  activeFilters = { map: '', smokes: false, flash: false, he: false, molotov: false };
  filterDropdown.classList.remove('open');
  filterBtn.classList.remove('active');
  renderFiltered();
});

searchInput.addEventListener('input', renderFiltered);

// ── Toggle HUD ──
tabPlays.addEventListener('click',     () => setMode('plays'));
tabPlaybooks.addEventListener('click', () => setMode('playbooks'));

function setMode(m: Mode): void {
  mode = m;
  tabPlays.classList.toggle('active',     m === 'plays');
  tabPlaybooks.classList.toggle('active', m === 'playbooks');
  filterWrapper.style.display = m === 'plays' ? '' : 'none';
  searchInput.value = '';
  renderFiltered();
}

// ── Filtros ──
function applyPlayFilters(plays: Play[]): Play[] {
  const q = searchInput.value.toLowerCase().trim();
  return plays.filter((p) => {
    if (q && !p.title.toLowerCase().includes(q))  return false;
    if (activeFilters.map    && p.map !== activeFilters.map) return false;
    if (activeFilters.smokes  && !p.smokes)       return false;
    if (activeFilters.flash   && !p.flashbangs)   return false;
    if (activeFilters.he      && !p.he_grenades)  return false;
    if (activeFilters.molotov && !p.molotovs)     return false;
    return true;
  });
}

function applyPlaybookFilters(pbs: Playbook[]): Playbook[] {
  const q = searchInput.value.toLowerCase().trim();
  return q ? pbs.filter((pb) => pb.title.toLowerCase().includes(q)) : pbs;
}

// ── Helpers ──
const MAP_LABELS: Record<string, string> = {
  mirage: 'Mirage', inferno: 'Inferno', dust2: 'Dust 2',
  nuke: 'Nuke', overpass: 'Overpass', ancient: 'Ancient',
  anubis: 'Anubis', vertigo: 'Vertigo', train: 'Train',
};

function extractYtId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be'))    return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? null;
  } catch { /* noop */ }
  return null;
}

function refreshIcons(): void {
  (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
}

// ── Play view modal ──
function closePlayView(): void {
  playViewModal.classList.remove('open');
  playViewModal.setAttribute('aria-hidden', 'true');
  pvThumb.querySelector('iframe')?.remove();
}

pvClose.addEventListener('click', closePlayView);
playViewModal.addEventListener('click', (e) => { if (e.target === playViewModal) closePlayView(); });

// tabs do modal de play
playViewModal.querySelectorAll<HTMLButtonElement>('[data-pvtab]').forEach((tab) => {
  tab.addEventListener('click', () => {
    playViewModal.querySelectorAll('[data-pvtab]').forEach((t) => t.classList.remove('active'));
    playViewModal.querySelectorAll('.modal__tab-panel').forEach((p) => p.classList.add('hidden'));
    tab.classList.add('active');
    playViewModal.querySelector(`#pvtab-${tab.dataset.pvtab}`)?.classList.remove('hidden');
  });
});

async function openPlayView(id: number): Promise<void> {
  // reset
  pvTitle.textContent     = 'Carregando...';
  pvMap.style.display     = 'none';
  pvYtLink.style.display  = 'none';
  pvThumb.innerHTML       = `<div class="play-thumb__placeholder"><i data-lucide="youtube"></i><span>Sem vídeo</span></div>`;
  pvDescription.textContent = '';
  pvContent.textContent   = '';

  // volta para aba desc
  playViewModal.querySelectorAll('[data-pvtab]').forEach((t) => t.classList.remove('active'));
  playViewModal.querySelectorAll('.modal__tab-panel').forEach((p) => p.classList.add('hidden'));
  playViewModal.querySelector('[data-pvtab="desc"]')?.classList.add('active');
  document.getElementById('pvtab-desc')?.classList.remove('hidden');

  playViewModal.classList.add('open');
  playViewModal.setAttribute('aria-hidden', 'false');
  refreshIcons();

  try {
    const play = await getPlay(id);

    pvTitle.textContent       = play.title;
    pvAuthor.textContent      = play.author ? `por ${play.author}` : '';
    pvDescription.textContent = play.description || '';
    pvContent.textContent     = play.content || '';

    const mapLabel = MAP_LABELS[play.map] ?? play.map ?? '';
    if (mapLabel) {
      pvMap.textContent   = mapLabel;
      pvMap.style.display = '';
      pvInfoMap.textContent = mapLabel;
    } else {
      pvInfoMap.textContent = '—';
    }

    const isPublic = play.visibility === 'public';
    pvVis.textContent = isPublic ? 'Pública' : 'Privada';
    pvVis.className   = `vis-badge${isPublic ? ' public' : ''}`;

    pvInfoPlayers.textContent = String(play.players_required || '—');
    pvInfoSmokes.textContent  = String(play.smokes   || 0);
    pvInfoFlash.textContent   = String(play.flashbangs || 0);
    pvInfoHe.textContent      = String(play.he_grenades || 0);
    pvInfoMolotov.textContent = String(play.molotovs  || 0);

    const ytId = extractYtId(play.video_url ?? '');
    if (ytId) {
      pvThumb.innerHTML = `<iframe class="yt-embed"
        src="https://www.youtube.com/embed/${ytId}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>`;
      pvYtLink.href          = play.video_url!;
      pvYtLink.style.display = 'flex';
    }
  } catch {
    pvTitle.textContent = 'Erro ao carregar play.';
  }
}

// ── Playbook view modal ──
function closePbView(): void {
  pbViewModal.classList.remove('open');
  pbViewModal.setAttribute('aria-hidden', 'true');
}

pbvClose.addEventListener('click', closePbView);
pbViewModal.addEventListener('click', (e) => { if (e.target === pbViewModal) closePbView(); });

async function openPlaybookView(id: number): Promise<void> {
  pbvTitle.textContent      = 'Carregando...';
  pbvMeta.textContent       = '';
  pbvDescription.textContent= '';
  pbvTracks.innerHTML       = `<div class="plays-checklist__loading">Carregando plays...</div>`;

  pbViewModal.classList.add('open');
  pbViewModal.setAttribute('aria-hidden', 'false');

  try {
    const pb = await getPlaybook(id);

    pbvTitle.textContent       = pb.title;
    pbvDescription.textContent = pb.description || '';

    const isPublic   = pb.visibility === 'public';
    const playsCount = pb.plays.length;
    pbvMeta.innerHTML = `
      <span class="vis-badge${isPublic ? ' public' : ''}">${isPublic ? 'Público' : 'Privado'}</span>
      <span><i data-lucide="crosshair"></i> ${playsCount} play${playsCount !== 1 ? 's' : ''}</span>
      <span><i data-lucide="user"></i> ${pb.author}</span>`;
    refreshIcons();

    if (playsCount === 0) {
      pbvTracks.innerHTML = `<div class="plays-checklist__empty">Nenhuma play neste playbook.</div>`;
      return;
    }

    pbvTracks.innerHTML = pb.plays.map((p, i) => {
      const play     = p as Play;
      const mapLabel = MAP_LABELS[play.map] ?? play.map ?? '';
      const ytId     = extractYtId(play.video_url ?? '');
      const thumbHtml = ytId
        ? `<img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" alt="" />`
        : `<i data-lucide="crosshair"></i>`;

      return `
      <div class="pb-track" data-play-id="${play.id}" style="cursor:pointer;">
        <span class="pb-track__num">${i + 1}</span>
        <div class="pb-track__thumb">${thumbHtml}</div>
        <div class="pb-track__info">
          <div class="pb-track__title">${play.title ?? '—'}</div>
          <div class="pb-track__meta">
            ${mapLabel ? `<span class="map-badge" style="font-size:0.65rem;padding:0.1rem 0.4rem;">${mapLabel}</span>` : ''}
            ${play.players_required ? `<span><i data-lucide="users"></i>${play.players_required}v</span>` : ''}
          </div>
        </div>
        <i data-lucide="chevron-right" style="color:#8b949e;flex-shrink:0;width:14px;height:14px;"></i>
      </div>`;
    }).join('');

    refreshIcons();

    pbvTracks.querySelectorAll<HTMLElement>('.pb-track[data-play-id]').forEach((track) => {
      track.addEventListener('click', () => {
        closePbView();
        openPlayView(Number(track.dataset.playId));
      });
    });
  } catch {
    pbvTitle.textContent = 'Erro ao carregar playbook.';
    pbvTracks.innerHTML  = '';
  }
}

// ── Fechar com Esc ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePlayView(); closePbView(); }
});

// ── Render plays ──
function renderPlays(plays: Play[]): void {
  resultCount.textContent = String(plays.length);

  if (plays.length === 0) {
    exploreGrid.innerHTML = `
      <div class="dash-empty" style="grid-column:1/-1;">
        <i data-lucide="crosshair"></i>
        <span>Nenhuma play encontrada.</span>
      </div>`;
    refreshIcons();
    return;
  }

  exploreGrid.innerHTML = plays.map((play) => {
    const mapLabel  = MAP_LABELS[play.map] ?? play.map ?? 'Sem mapa';
    const thumbId   = extractYtId(play.video_url ?? '');
    const thumbHtml = thumbId
      ? `<img class="item-card__thumb" src="https://img.youtube.com/vi/${thumbId}/mqdefault.jpg" alt="" />`
      : '';
    return `
    <div class="item-card explore-play-card" data-id="${play.id}" style="cursor:pointer;">
      ${thumbHtml}
      <div class="item-card__top">
        <span class="map-badge">${mapLabel}</span>
      </div>
      <div class="item-card__title">${play.title}</div>
      <div class="item-card__meta">
        <i data-lucide="user"></i>${play.author}
        ${play.players_required ? `&nbsp;·&nbsp;<i data-lucide="users"></i>${play.players_required}v` : ''}
      </div>
      ${play.description ? `<p style="font-size:0.8rem;color:#8b949e;line-height:1.5;">${play.description}</p>` : ''}
    </div>`;
  }).join('');

  refreshIcons();

  exploreGrid.querySelectorAll<HTMLElement>('.explore-play-card').forEach((card) => {
    card.addEventListener('click', () => openPlayView(Number(card.dataset.id)));
  });
}

// ── Render playbooks ──
function renderPlaybooks(pbs: Playbook[]): void {
  resultCount.textContent = String(pbs.length);

  if (pbs.length === 0) {
    exploreGrid.innerHTML = `
      <div class="dash-empty" style="grid-column:1/-1;">
        <i data-lucide="layers"></i>
        <span>Nenhum playbook encontrado.</span>
      </div>`;
    refreshIcons();
    return;
  }

  exploreGrid.innerHTML = pbs.map((pb) => {
    const playsCount = pb.plays.length;
    return `
    <div class="item-card explore-pb-card" data-id="${pb.id}" style="cursor:pointer;">
      <div class="item-card__top">
        <span class="map-badge" style="background:rgba(63,185,80,0.12);color:#56d364;">Playbook</span>
      </div>
      <div class="item-card__title">${pb.title}</div>
      <div class="item-card__meta">
        <i data-lucide="user"></i>${pb.author}
        &nbsp;·&nbsp;<i data-lucide="crosshair"></i>${playsCount} play${playsCount !== 1 ? 's' : ''}
      </div>
      ${pb.description ? `<p style="font-size:0.8rem;color:#8b949e;line-height:1.5;">${pb.description}</p>` : ''}
    </div>`;
  }).join('');

  refreshIcons();

  exploreGrid.querySelectorAll<HTMLElement>('.explore-pb-card').forEach((card) => {
    card.addEventListener('click', () => openPlaybookView(Number(card.dataset.id)));
  });
}

function renderFiltered(): void {
  if (mode === 'plays') renderPlays(applyPlayFilters(allPlays));
  else                  renderPlaybooks(applyPlaybookFilters(allPlaybooks));
}

// ── Load ──
async function load(): Promise<void> {
  exploreGrid.innerHTML = `<div class="dash-empty" style="grid-column:1/-1;"><i data-lucide="loader"></i><span>Carregando...</span></div>`;
  refreshIcons();
  errorBox.textContent = '';
  try {
    const [playsRes, playbooksRes] = await Promise.all([getPlays(), getPlaybooks()]);
    allPlays     = playsRes.results;
    allPlaybooks = playbooksRes.results;
    renderFiltered();
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível carregar o conteúdo.';
    exploreGrid.innerHTML = '';
  }
}

load();
