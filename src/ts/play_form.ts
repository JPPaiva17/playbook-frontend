import { PLAY_MAPS, createPlay, getPlay, isLoggedIn, updatePlay } from './api.js';
import type { PlayPayload } from './api.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const params = new URLSearchParams(window.location.search);
const playId = params.get('id') ? Number(params.get('id')) : null;

const pageTitle = document.getElementById('page-title') as HTMLElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const form = document.getElementById('play-form') as HTMLFormElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const mapSelect = document.getElementById('map') as HTMLSelectElement;

for (const map of PLAY_MAPS) {
  const option = document.createElement('option');
  option.value = map.value;
  option.textContent = map.label;
  mapSelect.appendChild(option);
}

function field(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

async function loadPlay(id: number): Promise<void> {
  try {
    const play = await getPlay(id);
    pageTitle.textContent = 'Editar Play';
    field('title').value = play.title;
    mapSelect.value = play.map;
    field('description').value = play.description;
    (document.getElementById('content') as HTMLTextAreaElement).value = play.content;
    field('video_url').value = play.video_url;
    field('players_required').value = String(play.players_required);
    (document.getElementById('visibility') as HTMLSelectElement).value = play.visibility;
    field('smokes').value = String(play.smokes);
    field('flashbangs').value = String(play.flashbangs);
    field('he_grenades').value = String(play.he_grenades);
    field('molotovs').value = String(play.molotovs);
    field('decoys').value = String(play.decoys);
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível carregar a play.';
  }
}

if (playId !== null) {
  loadPlay(playId);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  submitButton.disabled = true;

  const payload: PlayPayload = {
    title: field('title').value,
    description: field('description').value,
    content: (document.getElementById('content') as HTMLTextAreaElement).value,
    visibility: (document.getElementById('visibility') as HTMLSelectElement).value as 'public' | 'private',
    map: mapSelect.value,
    video_url: field('video_url').value,
    players_required: Number(field('players_required').value),
    smokes: Number(field('smokes').value),
    flashbangs: Number(field('flashbangs').value),
    he_grenades: Number(field('he_grenades').value),
    molotovs: Number(field('molotovs').value),
    decoys: Number(field('decoys').value),
  };

  try {
    if (playId !== null) {
      await updatePlay(playId, payload);
    } else {
      await createPlay(payload);
    }
    window.location.href = 'plays_screen.html';
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível salvar a play.';
  } finally {
    submitButton.disabled = false;
  }
});
