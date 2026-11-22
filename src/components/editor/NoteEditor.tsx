import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  Folder as FolderIcon,
  Undo2,
  Redo2,
  Pin,
  Bell,
  Lock,
  Unlock,
  MoreHorizontal,
  Palette,
  FileText,
  Upload,
  Plus,
  CheckSquare,
  GripVertical,
  Image as ImageIcon,
  Mic,
  Camera,
  LayoutGrid,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Code2,
  Link2,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Minus,
  Copy,
  Download,
  Trash2,
  X,
  Hash,
  Sparkles,
  Check,
  Share2,
} from 'lucide-react';
import { NOTE_TEMPLATES, PAPER_STYLES } from '../../constants/moods';
import { useJournal } from '../../context/JournalContext';
import type { EditorBlock, JournalNote, NoteStyle } from '../../types/journal';
import { exportNoteAsMarkdown, parseImportedTextToBlocks } from '../../utils/backup';
import { formatRelativeSaved, toDateKey } from '../../utils/dateUtils';
import { resolveEntryMood } from '../../utils/share';
import { PinModal } from '../PinModal';
import { ShareEntryModal } from '../ShareEntryModal';
import { BlockRenderer } from './BlockRenderer';
import { InsertBlockSheet, type InsertSelection } from './InsertBlockSheet';
import { VoiceRecorderBar } from './VoiceRecorderBar';

const isNoteCompletelyEmpty = (n: JournalNote): boolean => {
  if (n.title.trim()) return false;
  if (n.tags.length > 0) return false;
  return n.blocks.every((b) => {
    if (b.photoDataUrl || b.audioDataUrl) return false;
    if (
      b.type === 'table' ||
      b.type === 'sheet' ||
      b.type === 'chart' ||
      b.type === 'countdown' ||
      b.type === 'sticker' ||
      b.type === 'mood' ||
      b.type === 'date' ||
      b.type === 'dropdown'
    ) {
      return false;
    }
    if (b.checked) return false;
    if (b.childrenHtml && b.childrenHtml.trim()) return false;
    const text = b.html.replace(/<[^>]+>/g, '').trim();
    return text.length === 0;
  });
};

export const NoteEditor: React.FC = () => {
  const {
    activeNoteId,
    notes,
    checkIns,
    folders,
    draftNote,
    noteFont,
    openNote,
    updateDraftNote,
    commitDraftNote,
    closeNote,
    updateNote,
    deleteNote,
    duplicateNote,
    createFolder,
    hasPin,
    unlockedNoteIds,
    unlockNoteWithPin,
    lockNoteSession,
    configurePin,
    showToast,
  } = useJournal();

  const persistedNote = notes.find((n) => n.id === activeNoteId) || null;
  const isDraft = !persistedNote && !!draftNote && draftNote.id === activeNoteId;
  const note = persistedNote || (draftNote?.id === activeNoteId ? draftNote : null);

  const [history, setHistory] = useState<{ past: JournalNote[]; future: JournalNote[] }>({
    past: [],
    future: [],
  });
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showAaBar, setShowAaBar] = useState(false);
  const [insertSheetOpen, setInsertSheetOpen] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [styleSheetOpen, setStyleSheetOpen] = useState(false);
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [folderMenuOpen, setFolderMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [reminderMenuOpen, setReminderMenuOpen] = useState(false);
  const [wikiOpen, setWikiOpen] = useState(false);
  const [wikiSearch, setWikiSearch] = useState('');
  const [reorderMode, setReorderMode] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [pinMode, setPinMode] = useState<'verify' | 'setup' | null>(null);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrlDraft, setLinkUrlDraft] = useState('');
  const [unsavedPromptOpen, setUnsavedPromptOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory({ past: [], future: [] });
    setShowAaBar(false);
    setReorderMode(false);
    setRecordingVoice(false);
    setWikiOpen(false);
    setUnsavedPromptOpen(false);
  }, [activeNoteId]);

  const backlinks = useMemo(() => {
    if (!note) return [];
    return notes.filter(
      (other) =>
        other.id !== note.id &&
        other.blocks.some((b) => b.html.includes(`data-note-id="${note.id}"`))
    );
  }, [notes, note]);

  if (!note) return null;

  const isLockedAndHidden = note.locked && hasPin && !unlockedNoteIds.has(note.id);

  if (isLockedAndHidden) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF5E8] dark:bg-[#121215] flex flex-col items-center justify-center p-6">
        <div className="tactile-card max-w-sm w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 border-2 border-[#111111] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-amber-700 dark:text-amber-300" />
          </div>
          <h2 className="text-xl font-extrabold">{note.title || 'Private Note'}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This journal entry is locked with your local PIN.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeNote}
              className="flex-1 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-bold text-sm"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setPinMode('verify')}
              className="tactile-btn flex-1 py-2.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-bold text-sm"
            >
              Unlock
            </button>
          </div>
        </div>

        <PinModal
          isOpen={pinMode === 'verify'}
          mode="verify"
          onClose={() => setPinMode(null)}
          onSubmit={async (pin) => unlockNoteWithPin(note.id, pin)}
        />
      </div>
    );
  }

  const persistChange = (nextNote: JournalNote) => {
    if (isDraft) {
      updateDraftNote(nextNote);
    } else {
      updateNote(nextNote);
    }
  };

  const commitChange = (nextNote: JournalNote) => {
    setHistory((h) => ({
      past: [...h.past.slice(-24), note],
      future: [],
    }));
    persistChange(nextNote);
  };

  const handleUndo = () => {
    if (history.past.length === 0) return;
    const prev = history.past[history.past.length - 1];
    setHistory((h) => ({
      past: h.past.slice(0, -1),
      future: [note, ...h.future],
    }));
    persistChange(prev);
  };

  const handleRedo = () => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory((h) => ({
      past: [...h.past, note],
      future: h.future.slice(1),
    }));
    persistChange(next);
  };

  const handleSaveExplicit = async () => {
    if (isDraft) {
      if (isNoteCompletelyEmpty(note)) {
        showToast('Write a title or note before saving', 'info');
        return;
      }
      await commitDraftNote(note);
      return;
    }
    await updateNote(note);
    showToast('Note saved', 'success');
  };

  const handleRequestClose = () => {
    if (!isDraft || isNoteCompletelyEmpty(note)) {
      closeNote();
      return;
    }
    setUnsavedPromptOpen(true);
  };

  const isBlankNote =
    !note.title.trim() &&
    note.blocks.length === 1 &&
    note.blocks[0].type === 'paragraph' &&
    !note.blocks[0].html.replace(/<[^>]+>/g, '').trim();

  const updateBlock = (index: number, updated: EditorBlock) => {
    const nextBlocks = note.blocks.map((b, i) => (i === index ? updated : b));
    commitChange({ ...note, blocks: nextBlocks });
  };

  const insertBlockAfter = (newBlock: EditorBlock, targetIdx?: number) => {
    const idx =
      targetIdx !== undefined
        ? targetIdx
        : focusedBlockId
        ? note.blocks.findIndex((b) => b.id === focusedBlockId)
        : note.blocks.length - 1;
    const insertAt = idx >= 0 ? idx + 1 : note.blocks.length;
    const nextBlocks = [
      ...note.blocks.slice(0, insertAt),
      newBlock,
      ...note.blocks.slice(insertAt),
    ];
    commitChange({ ...note, blocks: nextBlocks });
    setFocusedBlockId(newBlock.id);
  };

  const convertFocusedBlock = (type: EditorBlock['type'], extra?: Partial<EditorBlock>) => {
    const idx = focusedBlockId
      ? note.blocks.findIndex((b) => b.id === focusedBlockId)
      : note.blocks.length - 1;
    if (idx < 0) return;
    const current = note.blocks[idx];
    const next = { ...current, type, ...extra };
    updateBlock(idx, next);
  };

  const handleMoveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= note.blocks.length) return;
    const nextBlocks = [...note.blocks];
    const [removed] = nextBlocks.splice(index, 1);
    nextBlocks.splice(target, 0, removed);
    commitChange({ ...note, blocks: nextBlocks });
  };

  const handleDeleteBlock = (index: number) => {
    if (note.blocks.length <= 1) {
      commitChange({
        ...note,
        blocks: [{ id: crypto.randomUUID(), type: 'paragraph', html: '' }],
      });
      return;
    }
    commitChange({
      ...note,
      blocks: note.blocks.filter((_, i) => i !== index),
    });
  };

  const handleInsertSelection = (sel: InsertSelection) => {
    if (sel.kind === 'quick-link') {
      setWikiOpen(true);
      return;
    }
    if (sel.kind === 'quick-tag') {
      setShowTagInput(true);
      return;
    }
    if (sel.kind === 'quick-date') {
      const todayStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      insertBlockAfter({ id: crypto.randomUUID(), type: 'paragraph', html: todayStr });
      return;
    }
    if (sel.kind === 'quick-time') {
      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      insertBlockAfter({ id: crypto.randomUUID(), type: 'paragraph', html: timeStr });
      return;
    }

    if (sel.blockType === 'photo') {
      setPhotoSheetOpen(true);
      return;
    }
    if (sel.blockType === 'voice') {
      setRecordingVoice(true);
      return;
    }

    const newBlock: EditorBlock = {
      id: crypto.randomUUID(),
      type: sel.blockType || 'paragraph',
      html: sel.blockType === 'rating' ? 'Rating' : '',
      calloutVariant: sel.calloutVariant,
      dividerStyle: sel.dividerStyle,
      toggleOpen: sel.blockType === 'toggle' ? true : undefined,
      checked: sel.blockType === 'checklist' ? false : undefined,
      moodScore: sel.blockType === 'mood' ? 5 : undefined,
      ratingValue: sel.blockType === 'rating' ? 4 : undefined,
      dateValue: sel.blockType === 'date' ? toDateKey(new Date()) : undefined,
    };
    insertBlockAfter(newBlock);
  };

  const handlePhotoFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        insertBlockAfter({
          id: crypto.randomUUID(),
          type: 'photo',
          html: '',
          photoDataUrl: reader.result,
        });
        setPhotoSheetOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportMarkdown = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const parsed = parseImportedTextToBlocks(reader.result);
      commitChange({
        ...note,
        title: note.title || parsed.title,
        blocks: parsed.blocks,
      });
      showToast('Imported content into note', 'success');
    };
    reader.readAsText(file);
  };

  const handleInsertWikiLink = (targetNote: JournalNote) => {
    const linkChip = `<span data-note-id="${targetNote.id}" contenteditable="false" class="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold text-sm cursor-pointer underline decoration-dotted">[[${targetNote.title || 'Untitled Note'}]]</span>&nbsp;`;

    const idx = focusedBlockId
      ? note.blocks.findIndex((b) => b.id === focusedBlockId)
      : note.blocks.length - 1;
    if (idx >= 0) {
      const current = note.blocks[idx];
      const cleaned = current.html.replace(/\[\[$/, '');
      updateBlock(idx, { ...current, html: `${cleaned}${linkChip}` });
    } else {
      insertBlockAfter({ id: crypto.randomUUID(), type: 'paragraph', html: linkChip });
    }
    setWikiOpen(false);
    setWikiSearch('');
  };

  const execInlineCommand = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    // Persist focused editable DOM change
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && activeEl.isContentEditable && focusedBlockId) {
      const idx = note.blocks.findIndex((b) => b.id === focusedBlockId);
      if (idx >= 0) {
        updateBlock(idx, { ...note.blocks[idx], html: activeEl.innerHTML });
      }
    }
  };

  const handleToggleLock = () => {
    if (!hasPin) {
      setPinMode('setup');
      return;
    }
    const nextLocked = !note.locked;
    commitChange({ ...note, locked: nextLocked });
    if (nextLocked) {
      lockNoteSession(note.id);
      showToast('Note locked with PIN', 'info');
    } else {
      showToast('Note unlocked', 'info');
    }
  };

  const currentFolder = folders.find((f) => f.id === note.folderId);
  const paperCfg = PAPER_STYLES[note.style?.paper || 'default'];
  const fontClass =
    note.style?.font === 'serif'
      ? 'font-serif'
      : note.style?.font === 'mono'
      ? 'font-mono'
      : 'font-note';
  const sizeClass =
    note.style?.size === 'sm'
      ? 'text-sm'
      : note.style?.size === 'lg'
      ? 'text-lg'
      : 'text-base';

  const wikiCandidates = notes.filter(
    (n) =>
      n.id !== note.id &&
      (n.title || 'Untitled Note').toLowerCase().includes(wikiSearch.trim().toLowerCase())
  );

  // Numbered list counter
  let numberedCounter = 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden transition-colors ${paperCfg.lightClass} ${paperCfg.darkClass}`}
    >
      {/* Top Bar — non-overlapping responsive layout */}
      <header className="max-w-3xl w-full mx-auto px-3 sm:px-6 pt-3 pb-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Back to Journal"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-[#111111]/20 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Folder Pill */}
          <div className="relative min-w-0">
            <button
              type="button"
              onClick={() => setFolderMenuOpen((v) => !v)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-black/10 dark:hover:bg-white/15 max-w-[116px] sm:max-w-[180px]"
            >
              <FolderIcon className="w-3.5 h-3.5 shrink-0 opacity-75" />
              <span className="truncate">{currentFolder?.name || 'No folder'}</span>
            </button>

            {folderMenuOpen && (
              <div className="tactile-card-sm absolute left-0 mt-2 w-56 bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 p-2 z-50 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    commitChange({ ...note, folderId: null });
                    setFolderMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                    note.folderId === null
                      ? 'bg-[#84C9A6] text-[#111111]'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  No folder
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      commitChange({ ...note, folderId: f.id });
                      setFolderMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      note.folderId === f.id
                        ? 'bg-[#84C9A6] text-[#111111]'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-[#111111]"
                      style={{ backgroundColor: f.color }}
                    />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newFolderInput.trim()) return;
                    const created = await createFolder(newFolderInput);
                    commitChange({ ...note, folderId: created.id });
                    setNewFolderInput('');
                    setFolderMenuOpen(false);
                  }}
                  className="pt-1 border-t border-zinc-200 dark:border-zinc-700 flex gap-1"
                >
                  <input
                    type="text"
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                    placeholder="New folder..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-lg bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-xs font-bold"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions: Undo/Redo, (Pin/Bell/Lock on sm+), More, Save */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 relative">
          <button
            type="button"
            disabled={history.past.length === 0}
            onClick={handleUndo}
            aria-label="Undo"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center disabled:opacity-30 shrink-0"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={history.future.length === 0}
            onClick={handleRedo}
            aria-label="Redo"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center disabled:opacity-30 shrink-0"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => commitChange({ ...note, pinned: !note.pinned })}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${
              note.pinned
                ? 'bg-[#84C9A6]/45 text-[#0A2E1E] dark:text-[#84C9A6]'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setReminderMenuOpen((v) => !v)}
            aria-label="Note reminder"
            className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${
              note.reminderAt
                ? 'bg-amber-200/60 text-amber-800 dark:text-amber-300'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleLock}
            aria-label={note.locked ? 'Unlock note' : 'Lock note'}
            className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0 ${
              note.locked
                ? 'bg-amber-200/60 text-amber-800 dark:text-amber-300'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            {note.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMoreMenuOpen((v) => !v)}
              aria-label="More note actions"
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center"
            >
              <MoreHorizontal className="w-5 h-5" />
              {(note.pinned || note.locked || note.reminderAt) && (
                <span className="sm:hidden absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#84C9A6] ring-1 ring-[#111111]" />
              )}
            </button>

            {moreMenuOpen && (
              <div className="tactile-card-sm absolute right-0 mt-2 w-52 bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 p-1.5 z-50 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    commitChange({ ...note, pinned: !note.pinned });
                    setMoreMenuOpen(false);
                  }}
                  className="sm:hidden w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    {note.pinned ? 'Unpin note' : 'Pin note'}
                  </span>
                  {note.pinned && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setReminderMenuOpen((v) => !v);
                  }}
                  className="sm:hidden w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {note.reminderAt ? 'Edit reminder' : 'Set reminder'}
                  </span>
                  {note.reminderAt && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    handleToggleLock();
                  }}
                  className="sm:hidden w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span className="flex items-center gap-2">
                    {note.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    {note.locked ? 'Unlock note' : 'Lock with PIN'}
                  </span>
                  {note.locked && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-700 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    setShareModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Share2 className="w-4 h-4" />
                  Share Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTemplateSheetOpen(true);
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Sparkles className="w-4 h-4" />
                  Apply template
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMoreMenuOpen(false);
                    if (isDraft) {
                      if (isNoteCompletelyEmpty(note)) {
                        showToast('Write a note before duplicating', 'info');
                        return;
                      }
                      const saved = await commitDraftNote(note);
                      const copy = await duplicateNote(saved.id);
                      if (copy) openNote(copy.id);
                      return;
                    }
                    const copy = await duplicateNote(note.id);
                    if (copy) openNote(copy.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportNoteAsMarkdown(note);
                    setMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Download className="w-4 h-4" />
                  Export Markdown
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    if (isDraft) {
                      closeNote();
                      showToast('Draft discarded', 'info');
                    } else {
                      deleteNote(note.id);
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDraft ? 'Discard draft' : 'Delete note'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveExplicit}
            className={`ml-0.5 sm:ml-1 px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-xs font-extrabold flex items-center gap-1 transition-transform active:translate-y-0.5 shrink-0 ${
              isDraft
                ? 'bg-[#E8C974] text-[#111111] hover:bg-[#dfc068]'
                : 'bg-[#84C9A6] text-[#111111] hover:bg-[#75be99]'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.75]" />
            <span>{isDraft ? 'Save' : 'Saved'}</span>
          </button>

          {reminderMenuOpen && (
            <div className="tactile-card-sm absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 p-3 z-50 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold">Note reminder date</p>
                <button
                  type="button"
                  onClick={() => setReminderMenuOpen(false)}
                  className="text-xs font-bold text-zinc-500"
                >
                  Done
                </button>
              </div>
              <input
                type="datetime-local"
                value={note.reminderAt || ''}
                onChange={(e) => commitChange({ ...note, reminderAt: e.target.value || undefined })}
                className="w-full px-2.5 py-1.5 rounded-xl border-2 border-[#111111]/30 dark:border-zinc-700 bg-transparent text-xs font-mono"
              />
              {note.reminderAt && (
                <button
                  type="button"
                  onClick={() => {
                    commitChange({ ...note, reminderAt: undefined });
                    setReminderMenuOpen(false);
                  }}
                  className="text-xs font-bold text-red-500"
                >
                  Clear reminder
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Scrollable Editor Surface — note font applies strictly inside the note content area */}
      <div className={`flex-1 overflow-y-auto px-5 sm:px-8 pb-44 ${fontClass}`}>
        <div className={`max-w-2xl mx-auto pt-2 space-y-4 ${sizeClass}`}>
          {/* Style + Saved status row (uses UI body font for chrome metadata) */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold opacity-80" style={{ fontFamily: 'var(--font-body)' }}>
            <button
              type="button"
              onClick={() => setStyleSheetOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition-colors font-bold border border-black/15 dark:border-white/15"
            >
              <Palette className="w-3.5 h-3.5" />
              Style
            </button>
            <span>
              {isDraft
                ? 'Unsaved draft · Tap Save to store on device'
                : `Saved on device · ${formatRelativeSaved(note.updatedAt)}`}
            </span>
            {note.pinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#84C9A6]/50 text-[#0A2E1E] dark:text-[#84C9A6] font-bold">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            {note.locked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-200/60 text-amber-900 dark:text-amber-300 font-bold">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          {/* Inline Style Picker Sheet */}
          {styleSheetOpen && (
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-[#1E1E24] text-[#111111] dark:text-zinc-100 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                  Page Style
                </span>
                <button
                  type="button"
                  onClick={() => setStyleSheetOpen(false)}
                  className="text-xs font-bold"
                >
                  Done
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(PAPER_STYLES) as NoteStyle['paper'][]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() =>
                      commitChange({ ...note, style: { ...note.style, paper: p } })
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                      note.style.paper === p
                        ? 'border-[#111111] dark:border-white ring-2 ring-[#84C9A6]'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: PAPER_STYLES[p].swatch }}
                    />
                    {PAPER_STYLES[p].label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-500 mr-1">Font:</span>
                  {(['sans', 'serif', 'mono'] as NoteStyle['font'][]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        commitChange({ ...note, style: { ...note.style, font: f } })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                        note.style.font === f
                          ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                          : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}
                    >
                      {f === 'sans' ? noteFont : f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-500 mr-1">Size:</span>
                  {(['sm', 'md', 'lg'] as NoteStyle['size'][]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        commitChange({ ...note, style: { ...note.style, size: sz } })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                        note.style.size === sz
                          ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                          : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <input
            type="text"
            value={note.title}
            onChange={(e) => commitChange({ ...note, title: e.target.value })}
            placeholder="Title"
            className="w-full bg-transparent font-display text-3xl sm:text-4xl font-extrabold tracking-tight placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none"
          />

          {/* Tags row */}
          {(note.tags.length > 0 || showTagInput) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-bold"
                >
                  <Hash className="w-3 h-3 opacity-60" />
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      commitChange({ ...note, tags: note.tags.filter((t) => t !== tag) })
                    }
                    className="opacity-60 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {showTagInput && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clean = newTagInput.trim().replace(/^#/, '');
                    if (clean && !note.tags.includes(clean)) {
                      commitChange({ ...note, tags: [...note.tags, clean] });
                    }
                    setNewTagInput('');
                    setShowTagInput(false);
                  }}
                  className="inline-flex items-center gap-1"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="tag..."
                    className="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-xs font-semibold focus:outline-none w-24"
                  />
                </form>
              )}
            </div>
          )}

          {/* Blocks */}
          <div className="space-y-2.5">
            {note.blocks.map((block, idx) => {
              if (block.type === 'numbered') numberedCounter += 1;
              else numberedCounter = 0;

              return (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  numberIndex={numberedCounter}
                  reorderMode={reorderMode}
                  isFirst={idx === 0}
                  isLast={idx === note.blocks.length - 1}
                  onChange={(updated) => updateBlock(idx, updated)}
                  onDelete={() => handleDeleteBlock(idx)}
                  onMove={(dir) => handleMoveBlock(idx, dir)}
                  onEnterNewBlock={() => {
                    const nextType =
                      block.type === 'checklist' ||
                      block.type === 'bullet' ||
                      block.type === 'numbered'
                        ? block.type
                        : 'paragraph';
                    insertBlockAfter(
                      {
                        id: crypto.randomUUID(),
                        type: nextType,
                        html: '',
                        checked: nextType === 'checklist' ? false : undefined,
                      },
                      idx
                    );
                  }}
                  onOpenWikiLink={() => setWikiOpen(true)}
                  onOpenNoteById={(targetId) => openNote(targetId)}
                  onFocusBlock={(id) => setFocusedBlockId(id)}
                />
              );
            })}
          </div>

          {/* Blank note quick starters matching screenshot 22 */}
          {isBlankNote && (
            <div className="pt-4 space-y-2.5 max-w-xs">
              <button
                type="button"
                onClick={() => setTemplateSheetOpen(true)}
                className="px-4 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 font-bold text-sm flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <FileText className="w-4 h-4" />
                Use a template
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="px-4 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 font-bold text-sm flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Upload className="w-4 h-4" />
                Import notes
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".md,.txt,text/markdown,text/plain"
                className="hidden"
                onChange={(e) => {
                  handleImportMarkdown(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {/* Wiki-link Backlinks */}
          {backlinks.length > 0 && (
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                Linked from ({backlinks.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {backlinks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openNote(b.id)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    [[{b.title || 'Untitled Note'}]]
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Editor Dock + Aa Drawer matching Screenshots 2, 19, 20, 22, 23 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none px-3 sm:px-6 pb-4">
        <div className="max-w-xl mx-auto pointer-events-auto">
          {recordingVoice && (
            <VoiceRecorderBar
              onCancel={() => setRecordingVoice(false)}
              onSave={(audioDataUrl, audioDuration) => {
                insertBlockAfter({
                  id: crypto.randomUUID(),
                  type: 'voice',
                  html: 'Voice memo',
                  audioDataUrl,
                  audioDuration,
                });
                setRecordingVoice(false);
              }}
            />
          )}

          {/* Wiki-link autocomplete popup matching screenshot 10 */}
          {wikiOpen && (
            <div className="mb-3 rounded-3xl bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-2xl p-3 space-y-2 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between gap-2 px-1">
                <input
                  type="text"
                  autoFocus
                  value={wikiSearch}
                  onChange={(e) => setWikiSearch(e.target.value)}
                  placeholder="Link to note..."
                  className="flex-1 text-sm font-semibold bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setWikiOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {wikiCandidates.length === 0 ? (
                <p className="text-xs text-zinc-500 px-2 py-2">No other notes found.</p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {wikiCandidates.slice(0, 6).map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleInsertWikiLink(candidate)}
                      className="w-full text-left px-2.5 py-2.5 flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {candidate.title || 'Untitled Note'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expandable Aa 2-Row Formatting Drawer */}
          {showAaBar && (
            <div className="mb-2.5 rounded-3xl bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-xl p-2 space-y-1.5">
              {/* Row 1: Block types */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1">
                <FormatBtn label="H1" onClick={() => convertFocusedBlock('h1')}>
                  <span className="font-extrabold text-xs">H1</span>
                </FormatBtn>
                <FormatBtn label="H2" onClick={() => convertFocusedBlock('h2')}>
                  <span className="font-extrabold text-xs">H2</span>
                </FormatBtn>
                <FormatBtn label="H3" onClick={() => convertFocusedBlock('h3')}>
                  <span className="font-extrabold text-xs">H3</span>
                </FormatBtn>
                <FormatBtn label="Normal text" onClick={() => convertFocusedBlock('paragraph')}>
                  <span className="font-bold text-xs">Tt</span>
                </FormatBtn>
                <FormatBtn label="Bulleted list" onClick={() => convertFocusedBlock('bullet')}>
                  <List className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Numbered list" onClick={() => convertFocusedBlock('numbered')}>
                  <ListOrdered className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Checklist" onClick={() => convertFocusedBlock('checklist', { checked: false })}>
                  <CheckSquare className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Quote" onClick={() => convertFocusedBlock('quote')}>
                  <Quote className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Callout" onClick={() => convertFocusedBlock('callout', { calloutVariant: 'note' })}>
                  <FileText className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Code block" onClick={() => convertFocusedBlock('code')}>
                  <Code2 className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn
                  label="Divider"
                  onClick={() =>
                    insertBlockAfter({
                      id: crypto.randomUUID(),
                      type: 'divider',
                      html: '',
                      dividerStyle: 'thick',
                    })
                  }
                >
                  <Minus className="w-4 h-4" />
                </FormatBtn>
              </div>

              {/* Row 2: Inline rich formatting */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-1 border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                <FormatBtn label="Bold" onClick={() => execInlineCommand('bold')}>
                  <Bold className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Italic" onClick={() => execInlineCommand('italic')}>
                  <Italic className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Underline" onClick={() => execInlineCommand('underline')}>
                  <Underline className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Strikethrough" onClick={() => execInlineCommand('strikeThrough')}>
                  <Strikethrough className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Text Color" onClick={() => execInlineCommand('foreColor', '#BA1F6D')}>
                  <span className="font-bold text-xs underline decoration-pink-500 decoration-2">A</span>
                </FormatBtn>
                <FormatBtn label="Highlight" onClick={() => execInlineCommand('hiliteColor', '#FEF08A')}>
                  <Highlighter className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn
                  label="Link"
                  onClick={() => setLinkInputOpen((v) => !v)}
                >
                  <Link2 className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn label="Clear formatting" onClick={() => execInlineCommand('removeFormat')}>
                  <RemoveFormatting className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn
                  label="Align Left"
                  onClick={() => {
                    const idx = note.blocks.findIndex((b) => b.id === focusedBlockId);
                    if (idx >= 0) updateBlock(idx, { ...note.blocks[idx], align: 'left' });
                  }}
                >
                  <AlignLeft className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn
                  label="Align Center"
                  onClick={() => {
                    const idx = note.blocks.findIndex((b) => b.id === focusedBlockId);
                    if (idx >= 0) updateBlock(idx, { ...note.blocks[idx], align: 'center' });
                  }}
                >
                  <AlignCenter className="w-4 h-4" />
                </FormatBtn>
                <FormatBtn
                  label="Align Right"
                  onClick={() => {
                    const idx = note.blocks.findIndex((b) => b.id === focusedBlockId);
                    if (idx >= 0) updateBlock(idx, { ...note.blocks[idx], align: 'right' });
                  }}
                >
                  <AlignRight className="w-4 h-4" />
                </FormatBtn>
              </div>

              {linkInputOpen && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clean = linkUrlDraft.trim();
                    if (clean) {
                      execInlineCommand('createLink', clean);
                    }
                    setLinkUrlDraft('');
                    setLinkInputOpen(false);
                  }}
                  className="flex items-center gap-2 px-1 pt-1 border-t border-zinc-100 dark:border-zinc-800"
                >
                  <input
                    type="url"
                    autoFocus
                    value={linkUrlDraft}
                    onChange={(e) => setLinkUrlDraft(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-medium focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-xs font-bold"
                  >
                    Link
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Main Floating Toolbar Dock */}
          <div className="rounded-full bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-2xl px-2.5 py-2 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setShowAaBar((v) => !v)}
              aria-label="Text formatting"
              className={`px-3.5 py-2 rounded-full font-bold text-sm transition-colors ${
                showAaBar
                  ? 'bg-[#F3F1EC] dark:bg-zinc-700 text-[#111111] dark:text-white'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              Aa
            </button>

            <button
              type="button"
              onClick={() => setInsertSheetOpen(true)}
              aria-label="Insert block"
              className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                insertBlockAfter({
                  id: crypto.randomUUID(),
                  type: 'checklist',
                  html: '',
                  checked: false,
                })
              }
              aria-label="Insert checklist"
              className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            >
              <CheckSquare className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setReorderMode((v) => !v)}
              aria-label="Reorder or delete blocks"
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                reorderMode
                  ? 'bg-[#84C9A6]/45 text-[#0A2E1E] dark:text-[#84C9A6]'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <GripVertical className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setWikiOpen((v) => !v)}
              aria-label="Link to a note"
              className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center font-mono font-bold text-xs"
            >
              [[ ]]
            </button>

            <button
              type="button"
              onClick={() => setPhotoSheetOpen(true)}
              aria-label="Add photo"
              className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setRecordingVoice((v) => !v)}
              aria-label="Record voice memo"
              className="w-12 h-11 rounded-2xl bg-[#18181D] text-white dark:bg-white dark:text-[#111111] flex items-center justify-center shadow-md"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Insert Block Sheet */}
      <InsertBlockSheet
        isOpen={insertSheetOpen}
        onClose={() => setInsertSheetOpen(false)}
        onSelect={handleInsertSelection}
      />

      {/* Add a Photo Bottom Sheet matching screenshot 10 */}
      {photoSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
          onClick={() => setPhotoSheetOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto sm:hidden" />
            <h3 className="text-2xl font-extrabold tracking-tight">Add a photo</h3>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full py-3 px-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3.5 text-base font-semibold"
            >
              <Camera className="w-5 h-5" />
              Take photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-full py-3 px-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3.5 text-base font-semibold"
            >
              <LayoutGrid className="w-5 h-5" />
              Choose from gallery
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handlePhotoFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handlePhotoFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      )}

      {/* Template Picker Sheet */}
      {templateSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
          onClick={() => setTemplateSheetOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold">Choose a template</h3>
              <button type="button" onClick={() => setTemplateSheetOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {NOTE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    commitChange({
                      ...note,
                      title: note.title || tpl.name,
                      blocks: tpl.createBlocks(),
                    });
                    setTemplateSheetOpen(false);
                  }}
                  className="w-full text-left p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 space-y-1"
                >
                  <p className="font-bold text-sm">{tpl.name}</p>
                  <p className="text-xs text-zinc-500">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Setup PIN modal if user tries to lock a note without a PIN yet */}
      <PinModal
        isOpen={pinMode === 'setup'}
        mode="setup"
        onClose={() => setPinMode(null)}
        onSubmit={async (pin) => {
          await configurePin(pin);
          commitChange({ ...note, locked: true });
          lockNoteSession(note.id);
          return true;
        }}
      />

      {/* Unsaved draft prompt when navigating back from a non-empty draft */}
      {unsavedPromptOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setUnsavedPromptOpen(false)}
        >
          <div
            className="tactile-card w-full max-w-sm p-6 space-y-4 text-[#111111] dark:text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-extrabold tracking-tight">Save this new note?</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You haven&apos;t tapped Save yet. Save this draft to keep it in your journal, or discard it so blank/unused drafts don&apos;t pile up.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={async () => {
                  await commitDraftNote(note);
                  setUnsavedPromptOpen(false);
                  closeNote();
                }}
                className="tactile-btn w-full py-2.5 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-sm"
              >
                Save &amp; Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnsavedPromptOpen(false);
                  closeNote();
                  showToast('Draft discarded', 'info');
                }}
                className="w-full py-2.5 rounded-xl border-2 border-red-500 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Discard Draft
              </button>
              <button
                type="button"
                onClick={() => setUnsavedPromptOpen(false)}
                className="w-full py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareEntryModal
        note={shareModalOpen ? note : null}
        mood={shareModalOpen ? resolveEntryMood(note, checkIns) : null}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
};

const FormatBtn: React.FC<{
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, onClick, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onMouseDown={(e) => {
      e.preventDefault(); // Keep contentEditable selection intact
      onClick();
    }}
    className="w-9 h-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center shrink-0"
  >
    {children}
  </button>
);
