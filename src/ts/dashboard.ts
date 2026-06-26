import { getMyPlaybooks, getMyPlays, getStoredUser, isLoggedIn, logout } from './api.js';
import type { Play, Playbook } from './api.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const welcomeText = document.getElementById('welcome-text') as HTMLElement;
const logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
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
      <li class="card">
        <strong>${play.title}</strong>
        <span class="badge">${play.map || 'sem mapa'}</span>
        <span class="badge">${play.visibility === 'public' ? 'Pública' : 'Privada'}</span>
      </li>`
    )
    .join('');
}

function renderPlaybooks(playbooks: Playbook[]): void {
  if (playbooks.length === 0) {
    playbooksList.innerHTML = '<li class="empty">Você ainda não criou nenhum playbook.</li>';
    return;
  }
  playbooksList.innerHTML = playbooks
    .map(
      (playbook) => `
      <li class="card">
        <strong>${playbook.title}</strong>
        <span class="badge">${playbook.plays.length} play(s)</span>
        <span class="badge">${playbook.visibility === 'public' ? 'Público' : 'Privado'}</span>
      </li>`
    )
    .join('');
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
