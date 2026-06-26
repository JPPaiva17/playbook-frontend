import { initAppbar } from './appbar.js';
import { PLAY_MAPS, getPlaybooks, getPlays } from './api.js';
import type { Play, Playbook } from './api.js';

// Injeta a appbar
initAppbar({ active: 'explore' });

// ── Elementos ──
const errorBox    = document.getElementById('error-message') as HTMLElement;
const exploreGrid = document.getElementById('explore-grid')  as HTMLElement;
const resultCount = document.getElementById('result-count')  as HTMLElement;
const searchInput   = document.getElementById('search-input')    as HTMLInputElement;
const filterBtn     = document.getElementById('filter-btn')      as HTMLButtonElement;
const filterDropdown= document.getElementById('filter-dropdown') as HTMLElement;
const filterMap     = document.getElementById('filter-map')      as HTMLSelectElement;
const filterWrapper = document.getElementById('filter-wrapper')  as HTMLElement;
const filterClear   = document.getElementById('filter-clear')    as HTMLButtonElement;
const filterApply   = document.getElementById('filter-apply')    as HTMLButtonElement;
const tabPlays      = document.getElementById('tab-plays')       as HTMLButtonElement;
const tabPlaybooks  = document.getElementById('tab-playbooks')   as HTMLButtonElement;

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

function gc(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

// ── Filter apply/clear ──
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
tabPlays.addEventListener('click', () => setMode('plays'));
tabPlaybooks.addEventListener('click', () => setMode('playbooks'));

function setMode(m: Mode): void {
  mode = m;
  tabPlays.classList.toggle('active', m === 'plays');
  tabPlaybooks.classList.toggle('active', m === 'playbooks');
  filterWrapper.style.display = m === 'plays' ? '' : 'none';
  searchInput.value = '';
  renderFiltered();
}

// ── Filtros ──
function applyPlayFilters(plays: Play[]): Play[] {
  const q = searchInput.value.toLowerCase().trim();
  return plays.filter((p) => {
    if (q && !p.title.toLowerCase().includes(q)) return false;
    if (activeFilters.map    && p.map !== activeFilters.map) return false;
    if (activeFilters.smokes  && !p.smokes)      return false;
    if (activeFilters.flash   && !p.flashbangs)  return false;
    if (activeFilters.he      && !p.he_grenades) return false;
    if (activeFilters.molotov && !p.molotovs)    return false;
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

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com'))
      return u.searchParams.get('v') ?? u.pathname.split('/').pop() ?? null;
  } catch { /* */ }
  return null;
}

function refreshIcons(): void {
  (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();
}

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
    const mapLabel = MAP_LABELS[play.map] ?? play.map ?? 'Sem mapa';
    const thumbId  = extractYouTubeId(play.video_url ?? '');
    const thumbHtml = thumbId
      ? `<img class="item-card__thumb" src="https://img.youtube.com/vi/${thumbId}/mqdefault.jpg" alt="" />`
      : '';
    return `
    <div class="item-card">
      ${thumbHtml}
      <div class="item-card__top">
        <span class="map-badge">${mapLabel}</span>
      </div>
      <div class="item-card__title">${play.title}</div>
      <div class="item-card__meta">
        <i data-lucide="user"></i>${play.author}
        ${play.players_required ? `&nbsp;·&nbsp;<i data-lucide="users"></i>${play.players_required}v` : ''}
      </div>
      ${play.description ? `<p style="font-size:0.8rem;color:#8b949e;line-height:1.5;margin-top:0.1rem;">${play.description}</p>` : ''}
      ${play.video_url ? `
        <div class="item-card__actions">
          <a href="${play.video_url}" target="_blank" rel="noopener" class="card-btn">
            <i data-lucide="youtube"></i> Ver vídeo
          </a>
        </div>` : ''}
    </div>`;
  }).join('');

  refreshIcons();
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
    <div class="item-card">
      <div class="item-card__top">
        <span class="map-badge" style="background:rgba(63,185,80,0.12);color:#56d364;">Playbook</span>
      </div>
      <div class="item-card__title">${pb.title}</div>
      <div class="item-card__meta">
        <i data-lucide="user"></i>${pb.author}
        &nbsp;·&nbsp;<i data-lucide="crosshair"></i>${playsCount} play${playsCount !== 1 ? 's' : ''}
      </div>
      ${pb.description ? `<p style="font-size:0.8rem;color:#8b949e;line-height:1.5;margin-top:0.1rem;">${pb.description}</p>` : ''}
      <div class="item-card__actions">
        <a href="playbook_detail.html?id=${pb.id}" class="card-btn">
          <i data-lucide="eye"></i> Ver playbook
        </a>
      </div>
    </div>`;
  }).join('');

  refreshIcons();
}

function renderFiltered(): void {
  if (mode === 'plays') {
    renderPlays(applyPlayFilters(allPlays));
  } else {
    renderPlaybooks(applyPlaybookFilters(allPlaybooks));
  }
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
