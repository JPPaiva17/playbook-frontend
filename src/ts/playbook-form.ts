import {
  createPlaybook,
  getMyPlays,
  getPlaybook,
  getPlays,
  isLoggedIn,
  updatePlaybook,
} from './api.js';
import type { Play, PlaybookPayload } from './api.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const params = new URLSearchParams(window.location.search);
const playbookId = params.get('id') ? Number(params.get('id')) : null;

const pageTitle = document.getElementById('page-title') as HTMLElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const form = document.getElementById('playbook-form') as HTMLFormElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const checklist = document.getElementById('plays-checklist') as HTMLElement;

function field(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

async function loadAvailablePlays(): Promise<Play[]> {
  const [publicPlays, myPlays] = await Promise.all([getPlays(), getMyPlays()]);
  const byId = new Map<number, Play>();
  for (const play of [...publicPlays.results, ...myPlays.results]) {
    byId.set(play.id, play);
  }
  return [...byId.values()];
}

function renderChecklist(plays: Play[], selectedIds: number[] = []): void {
  if (plays.length === 0) {
    checklist.innerHTML = '<li class="empty">Nenhuma play disponível. Crie uma primeiro.</li>';
    return;
  }
  checklist.innerHTML = plays
    .map(
      (play) => `
      <li class="card">
        <label class="checkbox-label">
          <input type="checkbox" name="play-id" value="${play.id}" ${
            selectedIds.includes(play.id) ? 'checked' : ''
          } />
          ${play.title} <span class="badge">${play.map || 'sem mapa'}</span>
        </label>
      </li>`
    )
    .join('');
}

async function init(): Promise<void> {
  let selectedIds: number[] = [];

  if (playbookId !== null) {
    try {
      const playbook = await getPlaybook(playbookId);
      pageTitle.textContent = 'Editar Playbook';
      field('title').value = playbook.title;
      (document.getElementById('description') as HTMLTextAreaElement).value = playbook.description;
      (document.getElementById('visibility') as HTMLSelectElement).value = playbook.visibility;
      selectedIds = playbook.plays.map((play) => (typeof play === 'number' ? play : play.id));
    } catch (err) {
      errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível carregar o playbook.';
    }
  }

  try {
    const plays = await loadAvailablePlays();
    renderChecklist(plays, selectedIds);
  } catch (err) {
    checklist.innerHTML = '<li class="empty">Erro ao carregar plays disponíveis.</li>';
  }
}

init();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  submitButton.disabled = true;

  const selectedPlays = Array.from(
    checklist.querySelectorAll<HTMLInputElement>('input[name="play-id"]:checked')
  ).map((input) => Number(input.value));

  const payload: PlaybookPayload = {
    title: field('title').value,
    description: (document.getElementById('description') as HTMLTextAreaElement).value,
    visibility: (document.getElementById('visibility') as HTMLSelectElement).value as 'public' | 'private',
    plays: selectedPlays,
  };

  try {
    if (playbookId !== null) {
      await updatePlaybook(playbookId, payload);
    } else {
      await createPlaybook(payload);
    }
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível salvar o playbook.';
  } finally {
    submitButton.disabled = false;
  }
});
