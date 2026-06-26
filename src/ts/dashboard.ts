import {
  deletePlay,
  deletePlaybook,
  getMyPlaybooks,
  getMyPlays,
  getStoredUser,
  isLoggedIn,
  logout,
} from './api.js';
import type { Play, Playbook } from './api.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const welcomeText = document.getElementById('welcome-text') as HTMLElement;
const logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const playsList = document.getElementById('plays-list') as HTMLElement;
const playbooksList = document.getElementById('playbooks-list') as HTMLElement;

const user = getStoredUser();
if (user) {
  welcomeText.textContent = `Olá, ${user.username}`;
}

logoutButton.addEventListener('click', () => {
  logout();
  window.location.href = 'login.html';
});

function renderPlays(plays: Play[]): void {
  if (plays.length === 0) {
    playsList.innerHTML = '<li class="empty">Você ainda não criou nenhuma play.</li>';
    return;
  }
  playsList.innerHTML = plays
    .map(
      (play) => `
      <li class="card" data-play-id="${play.id}">
        <strong>${play.title}</strong>
        <span class="badge">${play.map || 'sem mapa'}</span>
        <span class="badge">${play.visibility === 'public' ? 'Pública' : 'Privada'}</span>
        <div class="actions">
          <a href="play-form.html?id=${play.id}">Editar</a>
          <button type="button" class="delete-play-button" data-id="${play.id}">Excluir</button>
        </div>
      </li>`
    )
    .join('');

  playsList.querySelectorAll<HTMLButtonElement>('.delete-play-button').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja excluir esta play?')) return;
      try {
        await deletePlay(Number(button.dataset.id));
        loadDashboard();
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível excluir a play.';
      }
    });
  });
}

function renderPlaybooks(playbooks: Playbook[]): void {
  if (playbooks.length === 0) {
    playbooksList.innerHTML = '<li class="empty">Você ainda não criou nenhum playbook.</li>';
    return;
  }
  playbooksList.innerHTML = playbooks
    .map(
      (playbook) => `
      <li class="card" data-playbook-id="${playbook.id}">
        <a href="playbook-detail.html?id=${playbook.id}"><strong>${playbook.title}</strong></a>
        <span class="badge">${playbook.plays.length} play(s)</span>
        <span class="badge">${playbook.visibility === 'public' ? 'Público' : 'Privado'}</span>
        <div class="actions">
          <a href="playbook-form.html?id=${playbook.id}">Editar</a>
          <button type="button" class="delete-playbook-button" data-id="${playbook.id}">Excluir</button>
        </div>
      </li>`
    )
    .join('');

  playbooksList.querySelectorAll<HTMLButtonElement>('.delete-playbook-button').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja excluir este playbook?')) return;
      try {
        await deletePlaybook(Number(button.dataset.id));
        loadDashboard();
      } catch (err) {
        errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível excluir o playbook.';
      }
    });
  });
}

async function loadDashboard(): Promise<void> {
  try {
    const [plays, playbooks] = await Promise.all([getMyPlays(), getMyPlaybooks()]);
    renderPlays(plays.results);
    renderPlaybooks(playbooks.results);
  } catch (err) {
    playsList.innerHTML = '<li class="empty">Erro ao carregar plays.</li>';
    playbooksList.innerHTML = '<li class="empty">Erro ao carregar playbooks.</li>';
  }
}

loadDashboard();
