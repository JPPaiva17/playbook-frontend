import { confirmPasswordReset } from './api.js';
import { enablePasswordHold } from './password_toggle.js';

enablePasswordHold('new-password', 'new-password-toggle');
enablePasswordHold('new-password-confirm', 'new-password-confirm-toggle');

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/;

const params = new URLSearchParams(window.location.search);
const uidField = document.getElementById('uid') as HTMLInputElement;
const tokenField = document.getElementById('token') as HTMLInputElement;
if (params.get('uid')) uidField.value = params.get('uid')!;
if (params.get('token')) tokenField.value = params.get('token')!;

const form = document.getElementById('reset-form') as HTMLFormElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const successBox = document.getElementById('success-message') as HTMLElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;

function field(id: string): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  successBox.textContent = '';

  const newPassword = field('new-password').value;
  const newPasswordConfirm = field('new-password-confirm').value;

  if (!PASSWORD_PATTERN.test(newPassword)) {
    errorBox.textContent =
      'A senha deve ter no mínimo 8 caracteres, com 1 maiúscula, 1 minúscula e 1 caractere especial.';
    return;
  }
  if (newPassword !== newPasswordConfirm) {
    errorBox.textContent = 'As senhas não coincidem.';
    return;
  }

  submitButton.disabled = true;

  try {
    await confirmPasswordReset({
      uid: field('uid').value,
      token: field('token').value,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    successBox.textContent = 'Senha redefinida com sucesso! Você já pode entrar com a nova senha.';
    form.reset();
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível redefinir a senha.';
  } finally {
    submitButton.disabled = false;
  }
});
