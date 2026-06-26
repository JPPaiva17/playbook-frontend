import {
  changePassword,
  getMe,
  getMyPlaybooks,
  getMyPlays,
  isLoggedIn,
  logout,
  updateMe,
} from './api.js';
import { enablePasswordHold } from './password_toggle.js';

if (!isLoggedIn()) {
  window.location.href = 'login.html';
}

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/;

const errorBox = document.getElementById('error-message') as HTMLElement;
const successBox = document.getElementById('success-message') as HTMLElement;

const profileEdit = document.getElementById('profile-edit') as HTMLElement;
const editToggleButton = document.getElementById('edit-toggle-button') as HTMLButtonElement;
const cancelEditButton = document.getElementById('cancel-edit-button') as HTMLButtonElement;

const profileAvatar = document.getElementById('profile-avatar') as HTMLElement;
const profileUsername = document.getElementById('profile-username') as HTMLElement;
const profileEmail = document.getElementById('profile-email') as HTMLElement;
const profileJoined = document.getElementById('profile-joined') as HTMLElement;
const statPlays = document.getElementById('stat-plays') as HTMLElement;
const statPlaybooks = document.getElementById('stat-playbooks') as HTMLElement;

const form = document.getElementById('profile-form') as HTMLFormElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const logoutButton = document.getElementById('logout-button') as HTMLButtonElement;
const avatarInitials = document.getElementById('avatar-initials') as HTMLElement;
const avatarName = document.getElementById('avatar-name') as HTMLElement;
const dropName = document.getElementById('drop-name') as HTMLElement;
const dropEmail = document.getElementById('drop-email') as HTMLElement;
const avatarBtn = document.getElementById('avatar-btn') as HTMLButtonElement;
const avatarDropdown = document.getElementById('avatar-dropdown') as HTMLElement;

enablePasswordHold('current-password', 'current-password-toggle');
enablePasswordHold('new-password', 'new-password-toggle');
enablePasswordHold('new-password-confirm', 'new-password-confirm-toggle');

function field(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

function renderHeader(username: string, email: string): void {
  avatarInitials.textContent = username.slice(0, 2).toUpperCase();
  avatarName.textContent = username;
  dropName.textContent = username;
  dropEmail.textContent = email;
  profileAvatar.textContent = username.slice(0, 2).toUpperCase();
  profileUsername.textContent = username;
  profileEmail.textContent = email;
}

function openEdit(): void {
  profileEdit.hidden = false;
  profileEdit.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeEdit(): void {
  profileEdit.hidden = true;
  form.reset();
  errorBox.textContent = '';
}

editToggleButton.addEventListener('click', openEdit);
cancelEditButton.addEventListener('click', closeEdit);

logoutButton.addEventListener('click', () => {
  logout();
  window.location.href = 'login.html';
});

avatarBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  const open = avatarDropdown.classList.toggle('open');
  avatarBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', () => {
  avatarDropdown.classList.remove('open');
  avatarBtn.setAttribute('aria-expanded', 'false');
});

async function loadProfile(): Promise<void> {
  try {
    const user = await getMe();
    field('username').value = user.username;
    field('email').value = user.email;
    field('phone').value = user.phone ?? '';
    renderHeader(user.username, user.email);

    if (user.date_joined) {
      const joined = new Date(user.date_joined);
      profileJoined.textContent = `Na PlayBook desde ${joined.toLocaleDateString('pt-BR')}`;
    }
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível carregar o perfil.';
  }

  try {
    const [plays, playbooks] = await Promise.all([getMyPlays(), getMyPlaybooks()]);
    statPlays.textContent = String(plays.count);
    statPlaybooks.textContent = String(playbooks.count);
  } catch {
    // estatísticas são secundárias; não bloqueia a página em caso de erro
  }
}

loadProfile();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  successBox.textContent = '';

  const currentPassword = field('current-password').value;
  const newPassword = field('new-password').value;
  const newPasswordConfirm = field('new-password-confirm').value;
  const wantsPasswordChange = currentPassword || newPassword || newPasswordConfirm;

  if (wantsPasswordChange) {
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      errorBox.textContent = 'Preencha senha atual, nova senha e confirmação para trocar a senha.';
      return;
    }
    if (!PASSWORD_PATTERN.test(newPassword)) {
      errorBox.textContent =
        'A nova senha deve ter no mínimo 8 caracteres, com 1 maiúscula, 1 minúscula e 1 caractere especial.';
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      errorBox.textContent = 'As senhas não coincidem.';
      return;
    }
  }

  submitButton.disabled = true;

  try {
    const user = await updateMe({
      username: field('username').value,
      email: field('email').value,
      phone: field('phone').value,
    });
    renderHeader(user.username, user.email);

    if (wantsPasswordChange) {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
    }

    successBox.textContent = 'Perfil atualizado com sucesso.';
    closeEdit();
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível salvar o perfil.';
  } finally {
    submitButton.disabled = false;
  }
});
