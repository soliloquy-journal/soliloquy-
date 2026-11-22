import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  DEFAULT_SETTINGS,
  ensureDefaultSettings,
  seedWelcomeNoteIfEmpty,
} from '../db/database';
import type {
  AppSettings,
  CheckIn,
  CustomTag,
  Folder,
  JournalNote,
  MainTab,
  MoodScore,
  TagCategory,
  ThemePreference,
} from '../types/journal';
import { buildBackupPayload, downloadJsonFile } from '../utils/backup';
import { toDateKey } from '../utils/dateUtils';
import { hashPin } from '../utils/crypto';
import { applyNoteFont, initSavedNoteFont } from '../utils/noteFonts';

const BACKUP_MILESTONE_KEY = 'journal-backup-milestone-ack';

interface ToastMessage {
  id: string;
  text: string;
  tone?: 'info' | 'success' | 'error';
}

interface JournalContextValue {
  // Data
  checkIns: CheckIn[];
  notes: JournalNote[];
  folders: Folder[];
  customTags: CustomTag[];
  settings: AppSettings;
  isLoading: boolean;
  noteFont: string;
  setNoteFont: (fontName: string) => void;

  // Navigation & UI state
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  selectedJournalDate: string;
  setSelectedJournalDate: (dateKey: string) => void;
  activeNoteId: string | null;
  draftNote: JournalNote | null;
  openNote: (noteId: string) => void;
  openDraftNote: (partial?: Partial<JournalNote>) => JournalNote;
  updateDraftNote: (note: JournalNote) => void;
  commitDraftNote: (note: JournalNote) => Promise<JournalNote>;
  closeNote: () => void;

  // Modals
  checkInModalOpen: boolean;
  editingCheckIn: CheckIn | null;
  openNewCheckIn: (initialMood?: MoodScore, dateKey?: string) => void;
  openEditCheckIn: (checkIn: CheckIn) => void;
  closeCheckInModal: () => void;
  customTagsModalOpen: boolean;
  setCustomTagsModalOpen: (open: boolean) => void;
  privacyModalOpen: boolean;
  setPrivacyModalOpen: (open: boolean) => void;

  // Actions
  saveCheckIn: (data: Omit<CheckIn, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<CheckIn>;
  deleteCheckIn: (id: string) => Promise<void>;
  createNote: (partial?: Partial<JournalNote>) => Promise<JournalNote>;
  updateNote: (note: JournalNote) => Promise<void>;
  renameNote: (id: string, title: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<JournalNote | null>;
  reorderNotes: (orderedIds: string[]) => Promise<void>;
  createFolder: (name: string, color?: string) => Promise<Folder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  reorderFolders: (orderedIds: string[]) => Promise<void>;
  addCustomTag: (label: string, category?: TagCategory) => Promise<void>;
  removeCustomTag: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  resetAllData: () => Promise<void>;

  // Security / PIN
  hasPin: boolean;
  unlockedNoteIds: Set<string>;
  unlockNoteWithPin: (noteId: string, pin: string) => Promise<boolean>;
  lockNoteSession: (noteId: string) => void;
  configurePin: (newPin: string) => Promise<void>;
  clearPin: (currentPin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;

  // Notifications & Toasts
  toasts: ToastMessage[];
  showToast: (text: string, tone?: ToastMessage['tone']) => void;
  backupMilestoneToPrompt: number | null;
  dismissBackupReminder: () => void;
  exportQuickBackup: () => Promise<void>;
}

const JournalContext = createContext<JournalContextValue | null>(null);

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('journal');
  const [selectedJournalDate, setSelectedJournalDate] = useState<string>(() => toDateKey(new Date()));
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<JournalNote | null>(null);
  const [noteFont, setNoteFontState] = useState<string>(() => initSavedNoteFont());
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
  const [customTagsModalOpen, setCustomTagsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [unlockedNoteIds, setUnlockedNoteIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [acknowledgedBackupMilestone, setAcknowledgedBackupMilestone] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(BACKUP_MILESTONE_KEY) || '0') || 0;
    } catch {
      return 0;
    }
  });

  const checkInsQuery = useLiveQuery(() => db.checkIns.orderBy('timestamp').reverse().toArray(), []);
  const notesQuery = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []);
  const foldersQuery = useLiveQuery(() => db.folders.orderBy('createdAt').toArray(), []);
  const customTagsQuery = useLiveQuery(() => db.customTags.toArray(), []);
  const settingsQuery = useLiveQuery(() => db.settings.get('default'), []);

  const checkIns = checkInsQuery ?? [];

  const notes = useMemo(() => {
    const list = [...(notesQuery ?? [])];
    return list.sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notesQuery]);

  const folders = useMemo(() => {
    const list = [...(foldersQuery ?? [])];
    return list.sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [foldersQuery]);

  const customTags = customTagsQuery ?? [];
  const settings = settingsQuery ?? DEFAULT_SETTINGS;
  const isLoading = !initialized || settingsQuery === undefined;

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }

    Promise.all([ensureDefaultSettings(), seedWelcomeNoteIfEmpty()]).then(([s]) => {
      setInitialized(true);
      if (!s.hasSeenPrivacyIntro || !s.hasCompletedNameSetup) {
        setPrivacyModalOpen(true);
      }
    });
  }, []);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const totalEntriesCount = notes.length + checkIns.length;
  const currentBackupMilestone = Math.floor(totalEntriesCount / 10) * 10;
  const backupMilestoneToPrompt =
    !isLoading &&
    currentBackupMilestone >= 10 &&
    currentBackupMilestone > acknowledgedBackupMilestone
      ? currentBackupMilestone
      : null;

  const dismissBackupReminder = useCallback(() => {
    const nextAck = Math.max(currentBackupMilestone, acknowledgedBackupMilestone);
    setAcknowledgedBackupMilestone(nextAck);
    try {
      localStorage.setItem(BACKUP_MILESTONE_KEY, String(nextAck));
    } catch {
      // ignore storage errors
    }
  }, [currentBackupMilestone, acknowledgedBackupMilestone]);

  const exportQuickBackup = useCallback(async () => {
    const payload = await buildBackupPayload();
    downloadJsonFile(payload, `journal-backup-${toDateKey(new Date())}.json`);
    dismissBackupReminder();
    showToast('JSON backup exported safely', 'success');
  }, [dismissBackupReminder, showToast]);

  const setNoteFont = useCallback(
    (fontName: string) => {
      applyNoteFont(fontName);
      setNoteFontState(fontName);
      showToast(`Note font set to ${fontName}`, 'success');
    },
    [showToast]
  );

  // Apply theme & reduce-motion classes to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' || (settings.theme === 'system' && media.matches);
      root.classList.toggle('dark', isDark);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#121215' : '#FAF5E8');
      }
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    root.classList.toggle('reduce-motion', !!settings.reduceMotion);

    return () => {
      media.removeEventListener('change', applyTheme);
    };
  }, [settings.theme, settings.reduceMotion]);

  // Local evening reminder checker (runs purely offline inside browser tab)
  useEffect(() => {
    if (!settings.reminderEnabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayKey = toDateKey(now);
      const firedKey = `journal-reminded-${todayKey}-${settings.reminderTime}`;
      if (hhmm === settings.reminderTime && !localStorage.getItem(firedKey)) {
        localStorage.setItem(firedKey, '1');
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Soliloquy Reminder', {
            body: 'Take a quiet moment to write a note or check in on your day.',
            icon: '/icon.svg',
          });
        } else {
          showToast('Evening reminder: ready to write or check in?', 'info');
        }
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [settings.reminderEnabled, settings.reminderTime, showToast]);

  const openNote = useCallback((noteId: string) => {
    setDraftNote(null);
    setActiveNoteId(noteId);
  }, []);

  const openDraftNote = useCallback((partial?: Partial<JournalNote>): JournalNote => {
    const now = new Date().toISOString();
    const draft: JournalNote = {
      id: crypto.randomUUID(),
      title: partial?.title ?? '',
      folderId: partial?.folderId ?? null,
      dateKey: partial?.dateKey ?? toDateKey(new Date()),
      linkedCheckInId: partial?.linkedCheckInId,
      pinned: partial?.pinned ?? false,
      locked: partial?.locked ?? false,
      reminderAt: partial?.reminderAt,
      style: partial?.style ?? { paper: 'default', font: 'sans', size: 'md' },
      tags: partial?.tags ?? [],
      blocks:
        partial?.blocks && partial.blocks.length > 0
          ? partial.blocks
          : [{ id: crypto.randomUUID(), type: 'paragraph', html: '' }],
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };
    setDraftNote(draft);
    setActiveNoteId(draft.id);
    return draft;
  }, []);

  const updateDraftNote = useCallback((updated: JournalNote) => {
    setDraftNote({ ...updated, updatedAt: new Date().toISOString() });
  }, []);

  const commitDraftNote = useCallback(
    async (draft: JournalNote): Promise<JournalNote> => {
      const now = new Date().toISOString();
      const currentNotes = await db.notes.toArray();
      const minOrder = currentNotes.reduce(
        (min, n) => (n.sortOrder !== undefined ? Math.min(min, n.sortOrder) : min),
        0
      );
      const saved: JournalNote = {
        ...draft,
        sortOrder: draft.sortOrder ?? minOrder - 1,
        createdAt: draft.createdAt || now,
        updatedAt: now,
      };
      await db.notes.put(saved);
      setDraftNote(null);
      setActiveNoteId(saved.id);
      showToast('Note saved locally', 'success');
      return saved;
    },
    [showToast]
  );

  const closeNote = useCallback(() => {
    setDraftNote(null);
    setActiveNoteId(null);
  }, []);

  const openNewCheckIn = useCallback((initialMood?: MoodScore, dateKey?: string) => {
    if (initialMood || dateKey) {
      const now = new Date();
      const targetDate = dateKey || toDateKey(now);
      const [y, m, d] = targetDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), 0);
      setEditingCheckIn({
        id: '',
        moodScore: initialMood ?? 5,
        timestamp: dt.toISOString(),
        dateKey: targetDate,
        tags: [],
        createdAt: '',
        updatedAt: '',
      });
    } else {
      setEditingCheckIn(null);
    }
    setCheckInModalOpen(true);
  }, []);

  const openEditCheckIn = useCallback((checkIn: CheckIn) => {
    setEditingCheckIn(checkIn);
    setCheckInModalOpen(true);
  }, []);

  const closeCheckInModal = useCallback(() => {
    setCheckInModalOpen(false);
    setEditingCheckIn(null);
  }, []);

  const saveCheckIn = useCallback(
    async (data: Omit<CheckIn, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => {
      const now = new Date().toISOString();
      if (existingId) {
        const existing = await db.checkIns.get(existingId);
        const updated: CheckIn = {
          ...data,
          id: existingId,
          createdAt: existing?.createdAt || now,
          updatedAt: now,
        };
        await db.checkIns.put(updated);
        showToast('Check-in updated', 'success');
        return updated;
      }
      const created: CheckIn = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      await db.checkIns.put(created);
      showToast('Check-in saved locally', 'success');
      return created;
    },
    [showToast]
  );

  const deleteCheckIn = useCallback(
    async (id: string) => {
      await db.checkIns.delete(id);
      showToast('Check-in removed', 'info');
    },
    [showToast]
  );

  const createNote = useCallback(async (partial?: Partial<JournalNote>): Promise<JournalNote> => {
    const now = new Date().toISOString();
    const currentNotes = await db.notes.toArray();
    const minOrder = currentNotes.reduce(
      (min, n) => (n.sortOrder !== undefined ? Math.min(min, n.sortOrder) : min),
      0
    );
    const note: JournalNote = {
      id: crypto.randomUUID(),
      title: partial?.title ?? '',
      folderId: partial?.folderId ?? null,
      dateKey: partial?.dateKey ?? toDateKey(new Date()),
      linkedCheckInId: partial?.linkedCheckInId,
      pinned: partial?.pinned ?? false,
      locked: partial?.locked ?? false,
      reminderAt: partial?.reminderAt,
      style: partial?.style ?? { paper: 'default', font: 'sans', size: 'md' },
      tags: partial?.tags ?? [],
      blocks:
        partial?.blocks && partial.blocks.length > 0
          ? partial.blocks
          : [{ id: crypto.randomUUID(), type: 'paragraph', html: '' }],
      sortOrder: minOrder - 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.notes.put(note);
    return note;
  }, []);

  const updateNote = useCallback(async (note: JournalNote) => {
    await db.notes.put({
      ...note,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const renameNote = useCallback(
    async (id: string, title: string) => {
      const existing = await db.notes.get(id);
      if (!existing) return;
      await db.notes.put({
        ...existing,
        title: title.trim(),
        updatedAt: new Date().toISOString(),
      });
      showToast('Note renamed', 'success');
    },
    [showToast]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await db.notes.delete(id);
      setActiveNoteId((prev) => (prev === id ? null : prev));
      setDraftNote((prev) => (prev?.id === id ? null : prev));
      showToast('Note deleted', 'info');
    },
    [showToast]
  );

  const duplicateNote = useCallback(
    async (id: string): Promise<JournalNote | null> => {
      const orig = await db.notes.get(id);
      if (!orig) return null;
      const now = new Date().toISOString();
      const copy: JournalNote = {
        ...orig,
        id: crypto.randomUUID(),
        title: orig.title ? `${orig.title} (Copy)` : 'Untitled (Copy)',
        pinned: false,
        blocks: orig.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
        createdAt: now,
        updatedAt: now,
      };
      await db.notes.put(copy);
      showToast('Note duplicated', 'success');
      return copy;
    },
    [showToast]
  );

  const reorderNotes = useCallback(async (orderedIds: string[]) => {
    await db.transaction('rw', db.notes, async () => {
      await Promise.all(
        orderedIds.map((id, idx) => db.notes.update(id, { sortOrder: idx }))
      );
    });
  }, []);

  const createFolder = useCallback(
    async (name: string, color = '#84C9A6'): Promise<Folder> => {
      const currentFolders = await db.folders.toArray();
      const maxOrder = currentFolders.reduce(
        (max, f) => (f.sortOrder !== undefined ? Math.max(max, f.sortOrder) : max),
        -1
      );
      const folder: Folder = {
        id: crypto.randomUUID(),
        name: name.trim(),
        color,
        sortOrder: maxOrder + 1,
        createdAt: new Date().toISOString(),
      };
      await db.folders.put(folder);
      showToast(`Folder "${folder.name}" created`, 'success');
      return folder;
    },
    [showToast]
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      const clean = name.trim();
      if (!clean) return;
      await db.folders.update(id, { name: clean });
      showToast(`Folder renamed to "${clean}"`, 'success');
    },
    [showToast]
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await db.transaction('rw', [db.folders, db.notes], async () => {
        await db.notes.where('folderId').equals(id).modify({ folderId: null });
        await db.folders.delete(id);
      });
      showToast('Folder deleted (notes moved to No folder)', 'info');
    },
    [showToast]
  );

  const reorderFolders = useCallback(async (orderedIds: string[]) => {
    await db.transaction('rw', db.folders, async () => {
      await Promise.all(
        orderedIds.map((id, idx) => db.folders.update(id, { sortOrder: idx }))
      );
    });
  }, []);

  const addCustomTag = useCallback(
    async (label: string, category: TagCategory = 'Yours') => {
      const clean = label.trim();
      if (!clean) return;
      const existing = customTags.find((t) => t.label.toLowerCase() === clean.toLowerCase());
      if (existing) {
        if (existing.archived) {
          await db.customTags.update(existing.id, { archived: false });
          showToast(`Restored "${clean}"`, 'success');
        }
        return;
      }
      await db.customTags.put({
        id: crypto.randomUUID(),
        label: clean,
        category,
        archived: false,
        createdAt: new Date().toISOString(),
      });
      showToast(`Added "${clean}"`, 'success');
    },
    [customTags, showToast]
  );

  const removeCustomTag = useCallback(
    async (id: string) => {
      await db.customTags.update(id, { archived: true });
      showToast('Removed from check-in list', 'info');
    },
    [showToast]
  );

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const current = (await db.settings.get('default')) ?? DEFAULT_SETTINGS;
    await db.settings.put({ ...current, ...patch, id: 'default' });
  }, []);

  const setTheme = useCallback(
    async (theme: ThemePreference) => {
      await updateSettings({ theme });
    },
    [updateSettings]
  );

  const resetAllData = useCallback(async () => {
    await db.transaction(
      'rw',
      [db.checkIns, db.notes, db.folders, db.customTags, db.settings],
      async () => {
        await Promise.all([
          db.checkIns.clear(),
          db.notes.clear(),
          db.folders.clear(),
          db.customTags.clear(),
          db.settings.clear(),
        ]);
        await db.settings.put(DEFAULT_SETTINGS);
      }
    );
    try {
      localStorage.clear();
    } catch {
      // ignore storage errors
    }
    const defaultFont = initSavedNoteFont();
    setNoteFontState(defaultFont);
    setDraftNote(null);
    setActiveNoteId(null);
    setUnlockedNoteIds(new Set());
    setActiveTab('journal');
    setPrivacyModalOpen(true);
    showToast('All local data cleared', 'info');
  }, [showToast]);

  const verifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!settings.pinHash) return true;
      const hashed = await hashPin(pin);
      return hashed === settings.pinHash;
    },
    [settings.pinHash]
  );

  const unlockNoteWithPin = useCallback(
    async (noteId: string, pin: string): Promise<boolean> => {
      const ok = await verifyPin(pin);
      if (ok) {
        setUnlockedNoteIds((prev) => new Set(prev).add(noteId));
      }
      return ok;
    },
    [verifyPin]
  );

  const lockNoteSession = useCallback((noteId: string) => {
    setUnlockedNoteIds((prev) => {
      const next = new Set(prev);
      next.delete(noteId);
      return next;
    });
  }, []);

  const configurePin = useCallback(
    async (newPin: string) => {
      const hashed = await hashPin(newPin);
      await updateSettings({ pinHash: hashed });
      showToast('Journal PIN enabled', 'success');
    },
    [updateSettings, showToast]
  );

  const clearPin = useCallback(
    async (currentPin: string): Promise<boolean> => {
      const ok = await verifyPin(currentPin);
      if (!ok) return false;
      await updateSettings({ pinHash: undefined });
      await db.notes.toCollection().modify({ locked: false });
      setUnlockedNoteIds(new Set());
      showToast('Journal PIN removed', 'info');
      return true;
    },
    [verifyPin, updateSettings, showToast]
  );

  const value = useMemo<JournalContextValue>(
    () => ({
      checkIns,
      notes,
      folders,
      customTags,
      settings,
      isLoading,
      noteFont,
      setNoteFont,
      activeTab,
      setActiveTab,
      selectedJournalDate,
      setSelectedJournalDate,
      activeNoteId,
      draftNote,
      openNote,
      openDraftNote,
      updateDraftNote,
      commitDraftNote,
      closeNote,
      checkInModalOpen,
      editingCheckIn,
      openNewCheckIn,
      openEditCheckIn,
      closeCheckInModal,
      customTagsModalOpen,
      setCustomTagsModalOpen,
      privacyModalOpen,
      setPrivacyModalOpen,
      saveCheckIn,
      deleteCheckIn,
      createNote,
      updateNote,
      renameNote,
      deleteNote,
      duplicateNote,
      reorderNotes,
      createFolder,
      renameFolder,
      deleteFolder,
      reorderFolders,
      addCustomTag,
      removeCustomTag,
      updateSettings,
      setTheme,
      resetAllData,
      hasPin: !!settings.pinHash,
      unlockedNoteIds,
      unlockNoteWithPin,
      lockNoteSession,
      configurePin,
      clearPin,
      verifyPin,
      toasts,
      showToast,
      backupMilestoneToPrompt,
      dismissBackupReminder,
      exportQuickBackup,
    }),
    [
      checkIns,
      notes,
      folders,
      customTags,
      settings,
      isLoading,
      noteFont,
      setNoteFont,
      activeTab,
      selectedJournalDate,
      activeNoteId,
      draftNote,
      openNote,
      openDraftNote,
      updateDraftNote,
      commitDraftNote,
      closeNote,
      checkInModalOpen,
      editingCheckIn,
      openNewCheckIn,
      openEditCheckIn,
      closeCheckInModal,
      customTagsModalOpen,
      privacyModalOpen,
      saveCheckIn,
      deleteCheckIn,
      createNote,
      updateNote,
      renameNote,
      deleteNote,
      duplicateNote,
      reorderNotes,
      createFolder,
      renameFolder,
      deleteFolder,
      reorderFolders,
      addCustomTag,
      removeCustomTag,
      updateSettings,
      setTheme,
      resetAllData,
      unlockedNoteIds,
      unlockNoteWithPin,
      lockNoteSession,
      configurePin,
      clearPin,
      verifyPin,
      toasts,
      showToast,
      backupMilestoneToPrompt,
      dismissBackupReminder,
      exportQuickBackup,
    ]
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
};

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within JournalProvider');
  return ctx;
}
