import { PLAY_MAPS, getPlays, isLoggedIn } from './api.js';
import type { Play } from './api.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const errorBox = document.getElementById('error-message') as HTMLElement;
const playsList = document.getElementById('plays-list') as HTMLElement;
const filterForm = document.getElementById('filter-form') as HTMLFormElement;
const mapFilter = document.getElementById('map-filter') as HTMLSelectElement;
const searchInput = document.getElementById('search') as HTMLInputElement;

for (const map of PLAY_MAPS) {
  const option = document.createElement('option');
  option.value = map.value;
  option.textContent = map.label;
  mapFilter.appendChild(option);
}

function renderPlays(plays: Play[]): void {
  if (plays.length === 0) {
    playsList.innerHTML = '<li class="empty">Nenhuma play encontrada.</li>';
    return;
  }
  playsList.innerHTML = plays
    .map(
      (play) => `
      <li class="card card-block">
        <strong>${play.title}</strong>
        <span class="badge">${play.map || 'sem mapa'}</span>
        <span class="badge">${play.author}</span>
        <p>${play.description}</p>
        ${play.video_url ? `<a href="${play.video_url}" target="_blank" rel="noopener">Ver vídeo</a>` : ''}
      </li>`
    )
    .join('');
}

async function loadPlays(): Promise<void> {
  errorBox.textContent = '';
  const params: Record<string, string> = {};
  if (searchInput.value) params.search = searchInput.value;
  if (mapFilter.value) params.map = mapFilter.value;

  try {
    const plays = await getPlays(params);
    renderPlays(plays.results);
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível carregar as plays.';
  }
}

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadPlays();
});

loadPlays();
