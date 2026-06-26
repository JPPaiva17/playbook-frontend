import { getMe, isLoggedIn, logout, updateMe } from './api.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const errorBox = document.getElementById('error-message') as HTMLElement;
const successBox = document.getElementById('success-message') as HTMLElement;
const form = document.getElementById('profile-form') as HTMLFormElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
const avatarInitials = document.getElementById('avatar-initials') as HTMLElement;
const avatarName = document.getElementById('avatar-name') as HTMLElement;
const dropName = document.getElementById('drop-name') as HTMLElement;
const dropEmail = document.getElementById('drop-email') as HTMLElement;
const avatarBtn = document.getElementById('avatar-btn') as HTMLButtonElement;
const avatarDropdown = document.getElementById('avatar-dropdown') as HTMLElement;

function field(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function updateAvatar(username: string, email: string): void {
  avatarInitials.textContent = username.slice(0, 2).toUpperCase();
  avatarName.textContent = username;
  dropName.textContent = username;
  dropEmail.textContent = email;
}

logoutButton.addEventListener('click', () => {
  logout();
  window.location.href = 'login.html';
});

avatarBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = avatarDropdown.classList.toggle('open');
  avatarBtn.setAttribute('aria-expanded', String(open));
});

async function loadProfile(): Promise<void> {
  try {
    const user = await getMe();
    field('username').value = user.username;
    field('email').value = user.email;
    field('phone').value = user.phone ?? '';
    updateAvatar(user.username, user.email);
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível carregar o perfil.';
  }
}

loadProfile();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  successBox.textContent = '';
  submitButton.disabled = true;

  try {
    const user = await updateMe({
      username: field('username').value,
      email: field('email').value,
      phone: field('phone').value,
    });
    updateAvatar(user.username, user.email);
    successBox.textContent = 'Perfil atualizado com sucesso.';
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível salvar o perfil.';
  } finally {
    submitButton.disabled = false;
  }
});
