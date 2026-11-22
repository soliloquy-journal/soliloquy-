export interface GoogleNoteFontOption {
  name: string;
  category: 'Sans' | 'Serif' | 'Handwriting' | 'Mono';
  fallback: string;
}

export const NOTE_FONT_STORAGE_KEY = 'journal-note-font';
export const DEFAULT_NOTE_FONT = 'DM Sans';

export const GOOGLE_NOTE_FONTS: GoogleNoteFontOption[] = [
  { name: 'DM Sans', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Inter', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Space Grotesk', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Outfit', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Sora', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Manrope', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Poppins', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Nunito', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Rubik', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Work Sans', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'IBM Plex Sans', category: 'Sans', fallback: 'system-ui, sans-serif' },
  { name: 'Lora', category: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Merriweather', category: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Playfair Display', category: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Source Serif 4', category: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Libre Baskerville', category: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Crimson Pro', category: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Fraunces', category: 'Serif', fallback: 'Georgia, serif' },
  { name: 'Caveat', category: 'Handwriting', fallback: 'cursive' },
  { name: 'Patrick Hand', category: 'Handwriting', fallback: 'cursive' },
  { name: 'Kalam', category: 'Handwriting', fallback: 'cursive' },
  { name: 'JetBrains Mono', category: 'Mono', fallback: 'ui-monospace, monospace' },
  { name: 'Fira Code', category: 'Mono', fallback: 'ui-monospace, monospace' },
  { name: 'Space Mono', category: 'Mono', fallback: 'ui-monospace, monospace' },
];

const LINK_ELEMENT_ID = 'journal-dynamic-google-note-font';

export function getSavedNoteFont(): string {
  try {
    const saved = localStorage.getItem(NOTE_FONT_STORAGE_KEY);
    if (saved && GOOGLE_NOTE_FONTS.some((f) => f.name === saved)) {
      return saved;
    }
  } catch {
    // ignore storage access issues
  }
  return DEFAULT_NOTE_FONT;
}

export function applyNoteFont(fontName: string): void {
  const option =
    GOOGLE_NOTE_FONTS.find((f) => f.name === fontName) || GOOGLE_NOTE_FONTS[0];

  try {
    localStorage.setItem(NOTE_FONT_STORAGE_KEY, option.name);
  } catch {
    // ignore storage access issues
  }

  // Dynamically inject Google Fonts stylesheet for the chosen note font
  const encodedFamily = option.name.trim().replace(/\s+/g, '+');
  const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@400;500;600;700;800&display=swap`;

  let linkEl = document.getElementById(LINK_ELEMENT_ID) as HTMLLinkElement | null;
  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.id = LINK_ELEMENT_ID;
    linkEl.rel = 'stylesheet';
    document.head.appendChild(linkEl);
  }
  if (linkEl.href !== href) {
    linkEl.href = href;
  }

  // Update ONLY the note font CSS variable on :root so app UI font stays untouched
  document.documentElement.style.setProperty(
    '--font-note',
    `'${option.name}', ${option.fallback}`
  );
}

export function initSavedNoteFont(): string {
  const saved = getSavedNoteFont();
  applyNoteFont(saved);
  return saved;
}
