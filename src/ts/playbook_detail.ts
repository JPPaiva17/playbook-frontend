import { deletePlaybook, getPlay, getPlaybook, getStoredUser, isLoggedIn } from './api.js';
import type { Play } from './api.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const params = new URLSearchParams(window.location.search);
const playbookId = params.get('id') ? Number(params.get('id')) : null;

const errorBox = document.getElementById('error-message') as HTMLElement;
const headerBox = document.getElementById('playbook-header') as HTMLElement;
const playsList = document.getElementById('plays-list') as HTMLElement;

function renderPlays(plays: Play[]): void {
  if (plays.length === 0) {
    playsList.innerHTML = '<li class="empty">Este playbook ainda não tem plays.</li>';
    return;
  }
  playsList.innerHTML = plays
    .map(
      (play) => `
      <li class="card card-block">
        <strong>${play.title}</strong>
        <span class="badge">${play.map || 'sem mapa'}</span>
        <p>${play.description}</p>
        <p class="field-hint">Granadas: ${play.smokes} smoke(s), ${play.flashbangs} flash(es), ${play.he_grenades} HE, ${play.molotovs} molotov(s), ${play.decoys} decoy(s)</p>
        ${play.video_url ? `<a href="${play.video_url}" target="_blank" rel="noopener">Ver vídeo</a>` : ''}
      </li>`
    )
    .join('');
}

async function init(): Promise<void> {
  if (playbookId === null) {
    errorBox.textContent = 'Playbook não informado.';
    return;
  }

  try {
    const playbook = await getPlaybook(playbookId);
    const user = getStoredUser();
    const isAuthor = user !== null && playbook.author === user.email;

    headerBox.innerHTML = `
      <h1>${playbook.title}</h1>
      <p>${playbook.description}</p>
      <span class="badge">${playbook.visibility === 'public' ? 'Público' : 'Privado'}</span>
      ${
        isAuthor
          ? `<div class="actions">
               <a href="playbook_form.html?id=${playbook.id}">Editar</a>
               <button type="button" id="delete-button">Excluir</button>
             </div>`
          : ''
      }
    `;

    if (isAuthor) {
      const deleteButton = document.getElementById('delete-button') as HTMLButtonElement;
      deleteButton.addEventListener('click', async () => {
        if (!confirm('Tem certeza que deseja excluir este playbook?')) return;
        try {
          await deletePlaybook(playbook.id);
          window.location.href = 'plays_screen.html';
        } catch (err) {
          errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível excluir.';
        }
      });
    }

    const playIds = playbook.plays.map((play) => (typeof play === 'number' ? play : play.id));
    const plays = await Promise.all(playIds.map((id) => getPlay(id)));
    renderPlays(plays);
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível carregar o playbook.';
  }
}

init();
