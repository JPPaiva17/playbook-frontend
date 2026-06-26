import { isLoggedIn, register } from './api.js';
import { enablePasswordHold } from './password-toggle.js';

if (isLoggedIn()) {
  window.location.href = 'dashboard.html';
}

enablePasswordHold('password', 'password-toggle');
enablePasswordHold('password-confirm', 'password-confirm-toggle');

const PHONE_PATTERN = /^\d{10,11}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/;

const form = document.getElementById('register-form') as HTMLFormElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const username = (document.getElementById('username') as HTMLInputElement).value;
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const phone = (document.getElementById('phone') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const passwordConfirm = (document.getElementById('password-confirm') as HTMLInputElement).value;

  if (!PHONE_PATTERN.test(phone)) {
    errorBox.textContent = 'Celular deve conter DDD + número, somente dígitos (ex: 21987654321).';
    return;
  }

  if (!PASSWORD_PATTERN.test(password)) {
    errorBox.textContent =
      'A senha deve ter no mínimo 8 caracteres, com 1 maiúscula, 1 minúscula e 1 caractere especial.';
    return;
  }

  if (password !== passwordConfirm) {
    errorBox.textContent = 'As senhas não coincidem.';
    return;
  }

  submitButton.disabled = true;

  try {
    await register({ username, email, phone, password, password_confirm: passwordConfirm });
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível criar a conta.';
  } finally {
    submitButton.disabled = false;
  }
});
