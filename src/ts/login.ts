import { isLoggedIn, login } from './api.js';
import { enablePasswordHold } from './password_toggle.js';

if (isLoggedIn()) {
  window.location.href = 'plays_screen.html';
}

enablePasswordHold('password', 'password-toggle');

const form = document.getElementById('login-form') as HTMLFormElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  submitButton.disabled = true;

  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  try {
    await login({ email, password });
    window.location.href = 'plays_screen.html';
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Email ou senha incorretos.';
  } finally {
    submitButton.disabled = false;
  }
});
