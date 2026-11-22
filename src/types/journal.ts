export type MoodScore = 1 | 2 | 3 | 4 | 5 | 6;

export interface MoodMeta {
  score: MoodScore;
  label: string;
  statsLabel: string;
  bgHex: string;
  surfaceHex: string;
  accentHex: string;
  textHex: string;
  subTextHex: string;
  isLightBg: boolean;
}

export type TagCategory =
  | 'Mindset'
  | 'Energy & Health'
  | 'Habits'
  | 'Social'
  | 'Work & Goals'
  | 'Around Me'
  | 'Skipped'
  | 'Yours';

export interface CheckIn {
  id: string;
  moodScore: MoodScore;
  timestamp: string; // ISO string
  dateKey: string; // YYYY-MM-DD local
  tags: string[];
  quickNote?: string;
  linkedNoteId?: string;
  photoDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type EditorBlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'pullquote'
  | 'code'
  | 'checklist'
  | 'bullet'
  | 'numbered'
  | 'toggle'
  | 'callout'
  | 'table'
  | 'sheet'
  | 'chart'
  | 'photo'
  | 'voice'
  | 'divider'
  | 'sticker'
  | 'washi'
  | 'countdown'
  | 'date'
  | 'mood'
  | 'rating'
  | 'dropdown';

export type CalloutVariant =
  | 'info'
  | 'tip'
  | 'success'
  | 'warning'
  | 'danger'
  | 'note'
  | 'sticky'
  | 'quotecard'
  | 'keyidea';

export type DividerStyle =
  | 'thick'
  | 'dotted'
  | 'double'
  | 'ornament'
  | 'wavy'
  | 'stars'
  | 'floral'
  | 'dashed';

export interface ChartItem {
  label: string;
  value: number;
}

export interface EditorBlock {
  id: string;
  type: EditorBlockType;
  html: string;
  checked?: boolean;
  toggleOpen?: boolean;
  childrenHtml?: string;
  calloutVariant?: CalloutVariant;
  tableData?: string[][];
  chartTitle?: string;
  chartData?: ChartItem[];
  photoDataUrl?: string;
  photoCaption?: string;
  audioDataUrl?: string;
  audioDuration?: number;
  dividerStyle?: DividerStyle;
  stickerId?: string;
  washiVariant?: string;
  countdownTitle?: string;
  countdownDate?: string;
  dateValue?: string;
  moodScore?: MoodScore;
  ratingValue?: number;
  dropdownValue?: string;
  dropdownOptions?: string[];
  align?: 'left' | 'center' | 'right';
  dir?: 'ltr' | 'rtl';
}

export interface NoteStyle {
  paper: 'default' | 'warm' | 'sage' | 'lavender' | 'rose' | 'midnight';
  font: 'sans' | 'serif' | 'mono';
  size: 'sm' | 'md' | 'lg';
}

export interface JournalNote {
  id: string;
  title: string;
  folderId: string | null;
  dateKey: string; // YYYY-MM-DD
  linkedCheckInId?: string;
  pinned: boolean;
  locked: boolean;
  reminderAt?: string;
  style: NoteStyle;
  tags: string[];
  blocks: EditorBlock[];
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  sortOrder?: number;
  createdAt: string;
}

export interface CustomTag {
  id: string;
  label: string;
  category: TagCategory;
  archived: boolean;
  createdAt: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppSettings {
  id: 'default';
  userName: string;
  theme: ThemePreference;
  dailyReading: boolean;
  reduceMotion: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM
  pinHash?: string;
  hasSeenPrivacyIntro: boolean;
  hasCompletedNameSetup?: boolean;
  lastBackupAt?: string;
}

export type MainTab = 'today' | 'stats' | 'patterns' | 'journal' | 'settings';

export type StatsPeriod = '7d' | '30d' | 'month' | 'all';

export interface BackupPayload {
  version: number;
  exportedAt: string;
  app: 'Soliloquy' | 'Journal' | 'Moodella';
  checkIns: CheckIn[];
  notes: JournalNote[];
  folders: Folder[];
  customTags: CustomTag[];
  settings: AppSettings;
}
