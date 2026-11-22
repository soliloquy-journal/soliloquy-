import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  CheckIn,
  CustomTag,
  Folder,
  JournalNote,
} from '../types/journal';
import { toDateKey } from '../utils/dateUtils';

export class MoodellaDatabase extends Dexie {
  checkIns!: Table<CheckIn, string>;
  notes!: Table<JournalNote, string>;
  folders!: Table<Folder, string>;
  customTags!: Table<CustomTag, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('MoodellaLocalJournalDB');
    this.version(1).stores({
      checkIns: 'id, dateKey, timestamp, moodScore, linkedNoteId',
      notes: 'id, folderId, dateKey, pinned, locked, updatedAt, linkedCheckInId',
      folders: 'id, name, createdAt',
      customTags: 'id, label, category, archived',
      settings: 'id',
    });
    this.version(2).stores({
      checkIns: 'id, dateKey, timestamp, moodScore, linkedNoteId',
      notes: 'id, folderId, dateKey, pinned, locked, sortOrder, updatedAt, linkedCheckInId',
      folders: 'id, name, sortOrder, createdAt',
      customTags: 'id, label, category, archived',
      settings: 'id',
    });
  }
}

export const db = new MoodellaDatabase();

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default',
  userName: '',
  theme: 'light',
  dailyReading: true,
  reduceMotion: false,
  reminderEnabled: false,
  reminderTime: '20:00',
  hasSeenPrivacyIntro: false,
  hasCompletedNameSetup: false,
};

export const WELCOME_SEED_KEY = 'journal-welcome-seeded-v1';

export async function ensureDefaultSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('default');
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function seedWelcomeNoteIfEmpty(): Promise<void> {
  try {
    if (localStorage.getItem(WELCOME_SEED_KEY) === '1') return;
  } catch {
    // ignore localStorage errors
  }

  const [notesCount, checkInsCount, foldersCount] = await Promise.all([
    db.notes.count(),
    db.checkIns.count(),
    db.folders.count(),
  ]);

  if (notesCount === 0 && checkInsCount === 0 && foldersCount === 0) {
    const now = new Date().toISOString();
    const todayKey = toDateKey(new Date());

    const welcomeNote: JournalNote = {
      id: crypto.randomUUID(),
      title: 'Welcome to Soliloquy — Your Private Journal',
      folderId: null,
      dateKey: todayKey,
      pinned: true,
      locked: false,
      style: { paper: 'warm', font: 'sans', size: 'md' },
      tags: ['Welcome', 'Guide'],
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
      blocks: [
        {
          id: crypto.randomUUID(),
          type: 'callout',
          calloutVariant: 'tip',
          html: '<strong>100% Private &amp; Offline:</strong> Everything you write, record, or photograph stays strictly inside your device&apos;s local IndexedDB storage—zero accounts, zero cloud uploads, and zero AI telemetry.',
        },
        {
          id: crypto.randomUUID(),
          type: 'h2',
          html: 'Everything Inside Your Notebook',
        },
        {
          id: crypto.randomUUID(),
          type: 'bullet',
          html: '<strong>Journal Tab &amp; Folders:</strong> Organize notes into custom folders, drag or reorder cards via the 3-dot menu, pin favorites, or browse entries on the calendar.',
        },
        {
          id: crypto.randomUUID(),
          type: 'bullet',
          html: '<strong>Rich Block Editor:</strong> Tap <strong>+</strong> while writing to add checklists, callouts, tables, quotes, stickers, washi tape, photos, voice memos, or <code>[[wiki-links]]</code> between notes. Remember to tap <strong>Save</strong> when keeping a new note!',
        },
        {
          id: crypto.randomUUID(),
          type: 'bullet',
          html: '<strong>Today &amp; Mood Check-in Studio:</strong> Log a 6-step mood check-in with tags, timestamps, quick thoughts, or snapshots—and jump straight from a check-in into a linked journal entry.',
        },
        {
          id: crypto.randomUUID(),
          type: 'bullet',
          html: '<strong>Stats &amp; Patterns:</strong> Discover day-by-day charts, mood breakdowns, what helped vs. weighed on you, and time-of-day rhythms—all computed locally on your device.',
        },
        {
          id: crypto.randomUUID(),
          type: 'bullet',
          html: '<strong>Settings &amp; Backups:</strong> Pick from 25 Google Fonts strictly for your notes, enable a local PIN lock, install Soliloquy as an offline phone app (PWA), or export JSON backups and readable <code>.md</code> / <code>.txt</code> archives anytime.',
        },
        {
          id: crypto.randomUUID(),
          type: 'h3',
          html: 'Quick First Steps',
        },
        {
          id: crypto.randomUUID(),
          type: 'checklist',
          checked: false,
          html: 'Tap <strong>New Note</strong> or pick a template from Notebook Spotlight',
        },
        {
          id: crypto.randomUUID(),
          type: 'checklist',
          checked: false,
          html: 'Log your first Mood Check-in from Today or Journal',
        },
        {
          id: crypto.randomUUID(),
          type: 'checklist',
          checked: false,
          html: 'Export a JSON backup in Settings every now and then so you never lose your local data',
        },
      ],
    };

    await db.notes.put(welcomeNote);
  }

  try {
    localStorage.setItem(WELCOME_SEED_KEY, '1');
  } catch {
    // ignore localStorage errors
  }
}
