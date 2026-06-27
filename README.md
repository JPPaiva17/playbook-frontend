# PlayBook — Frontend

Trabalho da disciplina de Programação para Web (PUC-Rio, 2026/1).

**Integrantes:**
- João Pedro Paiva — 2110801
- Breno Raisch — 2110039

PlayBook é uma plataforma para jogadores de CS2 catalogarem e organizarem estratégias de jogo (execuções, defesas, anti-ecos, etc). O frontend é construído com HTML, CSS e TypeScript puros — sem frameworks JavaScript.

---

## Links

| | URL |
|---|---|
| 🌐 Site do frontend | `https://playbook-frontend.onrender.com` |
| 🌐 Site do backend | `https://playbook-backend.onrender.com` |
| 📦 Repositório frontend | `https://github.com/JPPaiva17/playbook-frontend` |
| 📦 Repositório backend | `https://github.com/JPPaiva17/playbook-backend` |
| 📖 Swagger (API docs) | `https://playbook-backend.onrender.com/api/docs/` |

---

## Telas

### Homepage
![Homepage](docs/screenshot-home.png)
*Página inicial com hero section, cards demonstrativos e seção de features.*

### Explorar
![Explorar](docs/screenshot-explorar.png)
*Tela de exploração com toggle entre Plays e Playbooks, busca em tempo real e filtros por mapa e granadas.*

### Minhas Plays
![Minhas Plays](docs/screenshot-plays.png)
*Dashboard de plays com criação via modal, preview de thumbnail do YouTube e filtros.*

### Modal de criação de Play
![Modal Play](docs/screenshot-modal-play.png)
*Modal com duas colunas: thumbnail do vídeo à esquerda e abas Descrição / Settings à direita.*

### Meus Playbooks
![Meus Playbooks](docs/screenshot-playbooks.png)
*Dashboard de playbooks com multiselect de plays e modal estilo playlist.*

---

## Stack

- **HTML5** — estrutura das páginas
- **CSS3** — estilização com variáveis, grid, flexbox e glassmorphism
- **TypeScript** — compilado para ES2020, sem bundler
- **Lucide Icons** — biblioteca de ícones SVG (via CDN)
- **Nginx** — servidor de arquivos estáticos (produção via Docker)

---

## Instalação local

### Pré-requisitos

- Node.js 18+
- Backend rodando em `http://localhost:8000` (ver repositório do backend)

### Passos

```bash
git clone https://github.com/JPPaiva17/playbook-frontend
cd playbook-frontend
npm install
npm run build
```

Abra `index.html` diretamente no navegador, ou sirva com qualquer servidor HTTP estático:

```bash
# Exemplo com Python
python3 -m http.server 3000
# Acesse http://localhost:3000
```

> **Atenção:** a URL da API está em `src/ts/api.ts`. Em desenvolvimento aponta para `http://localhost:8000/api`. Em produção, edite esse valor antes de buildar.

### Rodando com Docker

```bash
docker build -t playbook-frontend .
docker run --rm -p 3000:80 playbook-frontend
# Acesse http://localhost:3000
```

---

## Estrutura do projeto

```
playbook-frontend/
├── src/
│   ├── css/
│   │   ├── styles.css        # Estilos base compartilhados
│   │   ├── home.css          # Estilos da homepage
│   │   ├── auth.css          # Estilos de login/registro (glassmorphism)
│   │   └── dashboard.css     # Estilos das telas autenticadas
│   ├── ts/
│   │   ├── api.ts            # Cliente HTTP (fetch + refresh JWT automático)
│   │   ├── appbar.ts         # Componente de barra de navegação reutilizável
│   │   ├── plays_screen.ts   # Lógica da tela Minhas Plays
│   │   ├── playbooks_screen.ts # Lógica da tela Meus Playbooks
│   │   ├── plays_list.ts     # Lógica da tela Explorar
│   │   ├── login.ts          # Lógica de login
│   │   ├── register.ts       # Lógica de registro
│   │   └── password_toggle.ts # Botão mostrar/ocultar senha
│   └── images/
│       └── hero-bg.jpg       # Imagem de fundo da homepage
├── dist/js/                  # TypeScript compilado (gerado por `npm run build`)
├── index.html                # Homepage
├── login.html                # Login
├── register.html             # Registro
├── plays_screen.html         # Minhas Plays
├── playbooks_screen.html     # Meus Playbooks
├── plays_list.html           # Explorar (plays e playbooks públicos)
├── playbook_detail.html      # Detalhe de playbook
├── tsconfig.json
├── package.json
└── Dockerfile
```

---

## Manual de uso

### 1. Acesso

Acesse a homepage em `https://playbook-frontend.onrender.com`. Clique em **Criar conta** para se registrar ou **Entrar** se já tiver uma conta.

### 2. Registro e Login

- Preencha usuário, e-mail, celular (com DDD) e senha (mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 caractere especial).
- Após o login, o token JWT é armazenado no `localStorage` e renovado automaticamente quando expira.

### 3. Minhas Plays

- Acesse pelo menu **Minhas Plays**.
- Clique em **Criar Play** para abrir o modal de criação:
  - **Aba Descrição:** título, descrição e passo a passo da estratégia.
  - **Aba Settings:** mapa, visibilidade, número de players e granadas necessárias.
  - Cole uma URL do YouTube para ver a thumbnail ao vivo.
- Clique em um card para **visualizar** a play completa com embed do vídeo.
- Use o botão **Editar** para modificar ou **Excluir** para remover.
- Use a **barra de busca** ou o botão **Filtrar** para filtrar por mapa e tipo de granada.

### 4. Meus Playbooks

- Acesse pelo menu **Meus Playbooks**.
- Clique em **Criar Playbook** para abrir o modal:
  - Informe nome, descrição e visibilidade.
  - Selecione as plays que compõem o playbook via checklist com busca.
- Clique em um card para ver o playbook em estilo *playlist*, com todas as plays listadas.
- Clique em uma play dentro do playbook para ver seus detalhes.

### 5. Explorar

- Acesse pelo menu **Explorar**.
- Use o **toggle HUD** para alternar entre plays e playbooks públicos de todos os usuários.
- Clique em qualquer card para abrir o modal de visualização.

---

## Funcionalidades implementadas

- [x] CRUD completo de Plays (criar, listar, visualizar, editar, excluir)
- [x] CRUD completo de Playbooks (com seleção de plays via multiselect)
- [x] Autenticação JWT com refresh automático transparente
- [x] Registro com validação de senha forte e celular
- [x] Login com redirecionamento
- [x] Logout
- [x] Appbar reutilizável (gerado via TypeScript, sem duplicação de HTML)
- [x] Tela Explorar com toggle Plays / Playbooks
- [x] Busca em tempo real e filtros por mapa e granadas
- [x] Modal de criação de play com preview de thumbnail do YouTube
- [x] Modal de visualização com embed do YouTube
- [x] Modal de playbook em estilo playlist (click em track abre a play)
- [x] Visibilidade pública/privada por item
- [x] Regras de acesso: usuário só vê próprios privados + todos os públicos
- [x] Design responsivo (mobile-friendly)

---

## O que funcionou bem

- A arquitetura sem framework se mostrou viável para um projeto deste porte: o módulo `appbar.ts` eliminou a repetição de HTML em todas as páginas, e o `api.ts` centralizou toda a comunicação com o backend incluindo o refresh automático de token.
- O modal de criação de plays com preview de thumbnail do YouTube em tempo real foi um diferencial de UX que funcionou bem sem nenhuma biblioteca.
- O TypeScript com `tsconfig` simples e sem bundler manteve o build rápido e o processo de desenvolvimento direto.

## O que não foi implementado / limitações

- **Recuperação de senha:** o endpoint existe no backend mas o frontend não possui a tela de confirmação via token de e-mail (o servidor de e-mail não foi configurado no ambiente gratuito).
- **Paginação:** a listagem carrega apenas a primeira página de resultados da API; não há carregamento de mais itens.
- **Perfil do usuário:** a página `profile.html` está referenciada na navegação mas não foi implementada nesta versão.
- **Sem testes automatizados** no frontend (apenas validações manuais).
