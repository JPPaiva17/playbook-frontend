function enablePasswordHold(inputId: string, toggleId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const toggle = document.getElementById(toggleId) as HTMLElement;

  const show = (): void => {
    input.type = 'text';
  };
  const hide = (): void => {
    input.type = 'password';
  };

  toggle.addEventListener('mousedown', show);
  toggle.addEventListener('touchstart', show);
  toggle.addEventListener('mouseup', hide);
  toggle.addEventListener('mouseleave', hide);
  toggle.addEventListener('touchend', hide);
  toggle.addEventListener('contextmenu', (event) => event.preventDefault());
}

export { enablePasswordHold };
