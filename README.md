# Soliloquy — Private Offline Journal & Mood Companion

> **Soliloquy** is a local-first, 100% offline-capable personal journal and mood tracker built with React, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), and Vite. All your journal entries, notes, photos, voice memos, and mood check-ins remain 100% private and stored strictly on your device.

---

## ✨ Core Features

- **100% Private & Local-First**: IndexedDB storage via Dexie.js ensures your thoughts never touch a remote server or cloud database.
- **Neo-Brutalist Design**: Distinctive typography, thick 2px solid ink borders, hard offset shadows, and per-tab calm matte color themes.
- **Rich Block Editor**: Support for checklists, callouts, tables, markdown-style quotes, code blocks, stickers, washi tape, photo captions, voice recordings, and `[[wiki-links]]` between notes.
- **Mood Studio & Check-in Companion**: 6-step mood scale with custom Lucide icons, dynamic geometric badges, activity tags, day-by-day charts, and insights.
- **Note-Scoped Typography**: Choose from 25 popular Google Fonts strictly scoped to your notes while app menus maintain crisp UI typography.
- **Privacy-Safe Sharing**: Share app link or export individual entries either as formatted text or as beautiful Neo-Brutalist square PNG image cards rendered locally via HTML5 Canvas.
- **JSON & Readable Exports**: Export full backups as JSON or readable Markdown (`.md`) and plain text (`.txt`) archives anytime.
- **Progressive Web App (PWA)**: Install Soliloquy as a standalone app on your phone or desktop for full offline support.

---

## 🚀 Deploying to Cloudflare Pages via GitHub

### Which Files to Keep (Commit to GitHub)
When setting up your GitHub repository, keep and commit the source and configuration files:
- 📁 **`src/`** — All React components, context state management, and utility functions.
- 📁 **`public/`** — Static assets, PWA manifest, service workers, and hosting redirect rules (`_redirects`).
- 📄 **`package.json`** & **`bun.lock`** (or `package-lock.json`) — Project dependencies and build configuration.
- 📄 **`vite.config.ts`** — Vite and VitePWA build configuration.
- 📄 **`tsconfig.json`** — TypeScript compiler options.
- 📄 **`index.html`** — HTML entry point with SEO, Open Graph, and Schema.org structured data.
- 📄 **`.env.example`** — Template for environment variables.
- 📄 **`.gitignore`** — Git ignore rules.
- 📄 **`README.md`** — Project documentation.

### Which Files to Exclude (Do NOT Commit)
The following files and folders should **never** be committed to GitHub (and are handled automatically by `.gitignore`):
- ❌ **`node_modules/`** — Installed packages (Cloudflare installs dependencies automatically during build).
- ❌ **`dist/`** — Production build output (generated fresh by Cloudflare Pages on every deploy).
- ❌ **`.aistudio/`** — Internal AI Studio workspace artifacts and assistant memory.
- ❌ **`.env`** — Local secret keys or environment variables.

---

## 🛠️ Cloudflare Pages Build Settings

When connecting your GitHub repository to Cloudflare Pages, use these build settings:

| Setting | Value |
| :--- | :--- |
| **Framework preset** | `Vite` |
| **Build command** | `npm run build` (or `bun run build`) |
| **Build output directory** | `dist` |
| **Root directory** | `/` (leave blank) |

---

## 💻 Local Development Setup

If you want to run Soliloquy locally on your machine:

```bash
# 1. Clone your repository
git clone https://github.com/your-username/soliloquy.git
cd soliloquy

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🛡️ License

This project is open source and intended for personal use under the MIT License.
