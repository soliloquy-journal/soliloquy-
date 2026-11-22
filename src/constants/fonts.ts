export interface FontOption {
  id: string;
  label: string;
  category: 'Serif' | 'Sans' | 'Handwriting' | 'Monospace';
  stack: string;
  displayStack: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // Editorial Serif (8)
  {
    id: 'fraunces',
    label: 'Fraunces',
    category: 'Serif',
    stack: "'Fraunces', Georgia, serif",
    displayStack: "'Fraunces', Georgia, serif",
  },
  {
    id: 'lora',
    label: 'Lora',
    category: 'Serif',
    stack: "'Lora', Georgia, serif",
    displayStack: "'Lora', Georgia, serif",
  },
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    category: 'Serif',
    stack: "'Playfair Display', Georgia, serif",
    displayStack: "'Playfair Display', Georgia, serif",
  },
  {
    id: 'cormorant-garamond',
    label: 'Cormorant Garamond',
    category: 'Serif',
    stack: "'Cormorant Garamond', Georgia, serif",
    displayStack: "'Cormorant Garamond', Georgia, serif",
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    category: 'Serif',
    stack: "'Merriweather', Georgia, serif",
    displayStack: "'Merriweather', Georgia, serif",
  },
  {
    id: 'source-serif-4',
    label: 'Source Serif 4',
    category: 'Serif',
    stack: "'Source Serif 4', Georgia, serif",
    displayStack: "'Source Serif 4', Georgia, serif",
  },
  {
    id: 'crimson-pro',
    label: 'Crimson Pro',
    category: 'Serif',
    stack: "'Crimson Pro', Georgia, serif",
    displayStack: "'Crimson Pro', Georgia, serif",
  },
  {
    id: 'libre-baskerville',
    label: 'Libre Baskerville',
    category: 'Serif',
    stack: "'Libre Baskerville', Georgia, serif",
    displayStack: "'Libre Baskerville', Georgia, serif",
  },

  // Contemporary Sans (11)
  {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    category: 'Sans',
    stack: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    displayStack: "'Fraunces', 'Plus Jakarta Sans', Georgia, serif",
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    category: 'Sans',
    stack: "'DM Sans', system-ui, -apple-system, sans-serif",
    displayStack: "'DM Sans', system-ui, sans-serif",
  },
  {
    id: 'outfit',
    label: 'Outfit',
    category: 'Sans',
    stack: "'Outfit', system-ui, sans-serif",
    displayStack: "'Outfit', system-ui, sans-serif",
  },
  {
    id: 'manrope',
    label: 'Manrope',
    category: 'Sans',
    stack: "'Manrope', system-ui, sans-serif",
    displayStack: "'Manrope', system-ui, sans-serif",
  },
  {
    id: 'bricolage-grotesque',
    label: 'Bricolage Grotesque',
    category: 'Sans',
    stack: "'Bricolage Grotesque', system-ui, sans-serif",
    displayStack: "'Bricolage Grotesque', system-ui, sans-serif",
  },
  {
    id: 'work-sans',
    label: 'Work Sans',
    category: 'Sans',
    stack: "'Work Sans', system-ui, sans-serif",
    displayStack: "'Work Sans', system-ui, sans-serif",
  },
  {
    id: 'lexend',
    label: 'Lexend',
    category: 'Sans',
    stack: "'Lexend', system-ui, sans-serif",
    displayStack: "'Lexend', system-ui, sans-serif",
  },
  {
    id: 'sora',
    label: 'Sora',
    category: 'Sans',
    stack: "'Sora', system-ui, sans-serif",
    displayStack: "'Sora', system-ui, sans-serif",
  },
  {
    id: 'nunito',
    label: 'Nunito',
    category: 'Sans',
    stack: "'Nunito', system-ui, sans-serif",
    displayStack: "'Nunito', system-ui, sans-serif",
  },
  {
    id: 'quicksand',
    label: 'Quicksand',
    category: 'Sans',
    stack: "'Quicksand', system-ui, sans-serif",
    displayStack: "'Quicksand', system-ui, sans-serif",
  },
  {
    id: 'rubik',
    label: 'Rubik',
    category: 'Sans',
    stack: "'Rubik', system-ui, sans-serif",
    displayStack: "'Rubik', system-ui, sans-serif",
  },

  // Handwriting & Notebook (2)
  {
    id: 'caveat',
    label: 'Caveat',
    category: 'Handwriting',
    stack: "'Caveat', cursive, sans-serif",
    displayStack: "'Caveat', cursive, serif",
  },
  {
    id: 'patrick-hand',
    label: 'Patrick Hand',
    category: 'Handwriting',
    stack: "'Patrick Hand', cursive, sans-serif",
    displayStack: "'Patrick Hand', cursive, serif",
  },

  // Monospace (4)
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    category: 'Monospace',
    stack: "'JetBrains Mono', ui-monospace, monospace",
    displayStack: "'JetBrains Mono', ui-monospace, monospace",
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    category: 'Monospace',
    stack: "'Fira Code', ui-monospace, monospace",
    displayStack: "'Fira Code', ui-monospace, monospace",
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    category: 'Monospace',
    stack: "'IBM Plex Mono', ui-monospace, monospace",
    displayStack: "'IBM Plex Mono', ui-monospace, monospace",
  },
  {
    id: 'space-mono',
    label: 'Space Mono',
    category: 'Monospace',
    stack: "'Space Mono', ui-monospace, monospace",
    displayStack: "'Space Mono', ui-monospace, monospace",
  },
];

export function getFontOption(fontId?: string): FontOption {
  return FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[8]; // Default: Plus Jakarta Sans body + Fraunces editorial display
}
