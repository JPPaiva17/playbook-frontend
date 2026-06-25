import { isLoggedIn, register } from './api.js';

if (isLoggedIn()) {
  window.location.href = 'dashboard.html';
}

const form = document.getElementById('register-form') as HTMLFormElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const passwordConfirm = (document.getElementById('password-confirm') as HTMLInputElement).value;

  if (password !== passwordConfirm) {
    errorBox.textContent = 'As senhas não coincidem.';
    return;
  }

  submitButton.disabled = true;

  try {
    await register({ username, email, password, password_confirm: passwordConfirm });
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível criar a conta.';
  } finally {
    submitButton.disabled = false;
  }
});
