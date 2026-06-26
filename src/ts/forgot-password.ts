import { requestPasswordReset } from './api.js';

const form = document.getElementById('forgot-form') as HTMLFormElement;
const errorBox = document.getElementById('error-message') as HTMLElement;
const successBox = document.getElementById('success-message') as HTMLElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  successBox.textContent = '';
  submitButton.disabled = true;

  const email = (document.getElementById('email') as HTMLInputElement).value;

  try {
    await requestPasswordReset(email);
    successBox.textContent =
      'Se esse email estiver cadastrado, as instruções foram geradas. Verifique o console do servidor (ambiente de testes) e use o link "Redefinir senha".';
    form.reset();
  } catch (err) {
    errorBox.textContent = err instanceof Error ? err.message : 'Não foi possível processar o pedido.';
  } finally {
    submitButton.disabled = false;
  }
});
