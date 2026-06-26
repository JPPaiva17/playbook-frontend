import { getStoredUser, isLoggedIn, logout } from './api.js';

export type ActiveNav = 'explore' | 'plays' | 'playbooks';

export interface AppbarOptions {
  active: ActiveNav;
  createBtn?: {
    id: string;
    label: string;
  };
}

export function initAppbar(options: AppbarOptions): void {
  const root = document.getElementById('appbar-root');
  if (!root) return;

  const { active, createBtn } = options;

  const navLinks: { key: ActiveNav; href: string; icon: string; label: string }[] = [
    { key: 'explore',   href: 'plays_list.html',      icon: 'compass',   label: 'Explorar'       },
    { key: 'plays',     href: 'plays_screen.html',    icon: 'crosshair', label: 'Minhas Plays'   },
    { key: 'playbooks', href: 'playbooks_screen.html',icon: 'layers',    label: 'Meus Playbooks' },
  ];

  const navHtml = navLinks.map(({ key, href, icon, label }) => `
    <a href="${href}" class="nav-link${active === key ? ' active' : ''}">
      <i data-lucide="${icon}"></i>
      <span class="nav-label">${label}</span>
    </a>`).join('');

  const createHtml = createBtn ? `
    <button class="btn-create" id="${createBtn.id}">
      <i data-lucide="plus"></i>
      <span>${createBtn.label}</span>
    </button>` : '';

  root.innerHTML = `
    <header class="appbar">
      <div class="appbar__inner">
        <a href="index.html" class="appbar__logo">
          <i data-lucide="book-open"></i>
          <span>Play<strong>Book</strong></span>
        </a>

        <nav class="appbar__nav">${navHtml}</nav>

        <div class="appbar__actions">
          ${createHtml}
          <div class="avatar-wrapper">
            <button class="avatar-btn" id="avatar-btn" aria-expanded="false" aria-haspopup="true">
              <div class="avatar-circle" id="avatar-initials">?</div>
              <span id="avatar-name"></span>
              <span class="avatar-chevron"><i data-lucide="chevron-down"></i></span>
            </button>
            <div class="avatar-dropdown" id="avatar-dropdown">
              <div class="dropdown-header">
                <div class="drop-name" id="drop-name">—</div>
                <div class="drop-email" id="drop-email">—</div>
              </div>
              <a href="profile.html" class="dropdown-item">
                <i data-lucide="user"></i> Meu perfil
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" id="logout-button">
                <i data-lucide="log-out"></i> Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>`;

  // Renderiza os ícones do appbar
  (window as unknown as { lucide?: { createIcons: () => void } }).lucide?.createIcons();

  // Dados do usuário
  const user = getStoredUser();
  if (user) {
    const initials = document.getElementById('avatar-initials');
    const name     = document.getElementById('avatar-name');
    const dName    = document.getElementById('drop-name');
    const dEmail   = document.getElementById('drop-email');
    if (initials) initials.textContent = user.username.slice(0, 2).toUpperCase();
    if (name)     name.textContent     = user.username;
    if (dName)    dName.textContent    = user.username;
    if (dEmail)   dEmail.textContent   = user.email;
  }

  // Avatar dropdown
  const avatarBtn      = document.getElementById('avatar-btn')      as HTMLButtonElement;
  const avatarDropdown = document.getElementById('avatar-dropdown') as HTMLElement;

  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = avatarDropdown.classList.toggle('open');
    avatarBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', () => {
    avatarDropdown.classList.remove('open');
    avatarBtn.setAttribute('aria-expanded', 'false');
  });

  // Logout
  document.getElementById('logout-button')?.addEventListener('click', () => {
    logout();
    window.location.href = 'login.html';
  });

  // Guard: redireciona se não autenticado
  if (!isLoggedIn()) window.location.href = 'login.html';
}
