# Soliloquy

**A 100% free, offline-first Neo-Brutalist journal and mood tracker that runs completely on your device.**

🔗 **Live App:** [https://pages.dev](https://pages.dev) *(replace with your actual Cloudflare Pages link)*

---

## Why Soliloquy?

Most journaling apps lock basic features behind monthly subscriptions or store your personal thoughts on external company servers. **Soliloquy** is built around a simple rule: **your private thoughts belong only to you.**

- **100% Local-First Privacy:** Zero accounts, zero login, zero cloud servers, and zero tracking. Everything is stored locally inside your browser using IndexedDB (`Dexie.js`).
- **Completely Free Forever:** No paywalls, no ads, and no feature limits.
- **Works Offline (PWA):** Install it directly onto your Android, iOS, or desktop home screen and journal anywhere without an internet connection.

---

## Features

- **2-Step Daily Mood Check-In:** Log how you feel with an interactive slider, context tags, and quick reflections.
- **Notebook Spotlight & Folders:** Organize entries into custom folders, drag-and-drop to reorder notes, and filter by date or mood.
- **Calendar & Mood Analytics:** Visualize your journaling consistency, daily mood trends, and breakdowns at a glance.
- **25+ Dynamic Google Fonts:** Personalize the reading and writing typography anytime from Settings.
- **Full Data Ownership:** 1-click **JSON Backup & Restore**, readable `.txt`/`.md` exports, and safe data reset controls.
- **Client-Side Sharing:** Share individual reflection cards or invite friends via your device's native share menu without exposing your diary.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS (Neo-Brutalist UI)
- **Local Database:** IndexedDB via [Dexie.js](https://dexie.org)
- **Icons:** [Lucide React](https://lucide.dev)
- **Hosting:** Cloudflare Pages

---

## Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com
   cd soliloquy
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## Data Safety Notice

Because **Soliloquy** does not use cloud servers, all journal entries live strictly inside your browser's local storage. Clearing your browser's site data will erase your entries—please use the **Export Backup (.json)** feature in Settings regularly to keep a safe copy on your device or personal drive.

## License

MIT License — free to use, inspect, and learn from.
