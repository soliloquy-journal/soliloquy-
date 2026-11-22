import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Folder as FolderIcon,
  FolderPlus,
  Search,
  Pin,
  Lock,
  Mic,
  Image as ImageIcon,
  Upload,
  Trash2,
  FileText,
  Sparkles,
  PenLine,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Pencil,
  GripVertical,
  Share2,
} from 'lucide-react';
import { NOTE_TEMPLATES, TAB_THEMES, getMoodMeta } from '../constants/moods';
import { useJournal } from '../context/JournalContext';
import type { Folder, JournalNote } from '../types/journal';
import { roundMoodScore } from '../utils/analytics';
import { parseImportedTextToBlocks } from '../utils/backup';
import { formatLongDate, formatMonthYear, formatShortTime, fromDateKey, getCalendarGrid, toDateKey } from '../utils/dateUtils';
import { resolveEntryMood } from '../utils/share';
import { MoodBadge, MoodCharacterSVG } from './MoodCharacters';
import { PinModal } from './PinModal';
import { PWAInstallButton } from './PWAInstallButton';
import { ShareEntryModal } from './ShareEntryModal';
import { TactileSelect } from './TactileSelect';

const JOURNAL_THEME = TAB_THEMES.journal;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FOLDER_COLORS = ['#84C9A6', '#DF9BB9', '#E8C974', '#7CA8DB', '#A98FD3'];

type NoteSort = 'custom' | 'updated' | 'date' | 'title';

const SORT_OPTIONS: { value: NoteSort; label: string }[] = [
  { value: 'custom', label: 'Custom order' },
  { value: 'updated', label: 'Recently edited' },
  { value: 'date', label: 'Entry date' },
  { value: 'title', label: 'Title A–Z' },
];

export const JournalView: React.FC = () => {
  const {
    checkIns,
    notes,
    folders,
    settings,
    selectedJournalDate,
    setSelectedJournalDate,
    openNote,
    openDraftNote,
    createNote,
    renameNote,
    deleteNote,
    reorderNotes,
    createFolder,
    renameFolder,
    deleteFolder,
    reorderFolders,
    openNewCheckIn,
    openEditCheckIn,
    hasPin,
    unlockedNoteIds,
    unlockNoteWithPin,
    showToast,
  } = useJournal();

  const initialDate = fromDateKey(selectedJournalDate);
  const [calYear, setCalYear] = useState(initialDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDate.getMonth());
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all'); // 'all' | 'none' | folderId
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<NoteSort>('custom');
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [pendingUnlockNoteId, setPendingUnlockNoteId] = useState<string | null>(null);
  const [pendingUnlockPurpose, setPendingUnlockPurpose] = useState<'open' | 'share'>('open');
  const [shareTargetNote, setShareTargetNote] = useState<JournalNote | null>(null);

  // Reordering & 3-dot menus state
  const [folderMenuState, setFolderMenuState] = useState<{
    folder: Folder;
    index: number;
    top: number;
    left: number;
  } | null>(null);
  const [noteMenuId, setNoteMenuId] = useState<string | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  // Rename & Delete Confirmation Modals
  const [renameTarget, setRenameTarget] = useState<{
    type: 'note' | 'folder';
    id: string;
    value: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'note' | 'folder';
    id: string;
    label: string;
  } | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  const gridCells = getCalendarGrid(calYear, calMonth);
  const daysWithReadings = new Set(checkIns.map((c) => c.dateKey)).size;

  const greetingName = settings.userName.trim();
  const todayFormatted = formatLongDate(new Date());

  const shiftMonth = (delta: number) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const selectedDayCheckIns = checkIns
    .filter((c) => c.dateKey === selectedJournalDate)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const selectedDayAvg =
    selectedDayCheckIns.length > 0
      ? roundMoodScore(
          selectedDayCheckIns.reduce((s, c) => s + c.moodScore, 0) / selectedDayCheckIns.length
        )
      : null;

  const selectedDayNotes = notes.filter((n) => n.dateKey === selectedJournalDate);

  const getActiveFolderTarget = () =>
    selectedFolderId !== 'all' && selectedFolderId !== 'none' ? selectedFolderId : null;

  const handleNewNote = (forSelectedDate = false) => {
    openDraftNote({
      folderId: getActiveFolderTarget(),
      dateKey: forSelectedDate ? selectedJournalDate : toDateKey(new Date()),
    });
  };

  const handleNewFromTemplate = (templateId: string) => {
    const tpl = NOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    openDraftNote({
      title: tpl.name,
      folderId: getActiveFolderTarget(),
      dateKey: toDateKey(new Date()),
      blocks: tpl.createBlocks(),
    });
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const color = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
    const folder = await createFolder(newFolderName, color);
    setSelectedFolderId(folder.id);
    setNewFolderName('');
    setNewFolderOpen(false);
  };

  const handleImportTextNote = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      const { title, blocks } = parseImportedTextToBlocks(reader.result);
      const created = await createNote({
        title: title || file.name.replace(/\.(md|txt)$/i, ''),
        folderId: getActiveFolderTarget(),
        blocks,
      });
      showToast('Note imported', 'success');
      openNote(created.id);
    };
    reader.readAsText(file);
  };

  const handleOpenNoteCard = (note: JournalNote) => {
    if (note.locked && hasPin && !unlockedNoteIds.has(note.id)) {
      setPendingUnlockPurpose('open');
      setPendingUnlockNoteId(note.id);
      return;
    }
    openNote(note.id);
  };

  const handleShareNoteCard = (note: JournalNote) => {
    setNoteMenuId(null);
    if (note.locked && hasPin && !unlockedNoteIds.has(note.id)) {
      setPendingUnlockPurpose('share');
      setPendingUnlockNoteId(note.id);
      return;
    }
    setShareTargetNote(note);
  };

  const reorderWithinFullNotes = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const fullIds = notes.map((n) => n.id);
    const fromIdx = fullIds.indexOf(sourceId);
    const toIdx = fullIds.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...fullIds];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    if (sortBy !== 'custom') setSortBy('custom');
    await reorderNotes(next);
  };

  const moveNoteInGroup = async (group: JournalNote[], index: number, dir: -1 | 1) => {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= group.length) return;
    await reorderWithinFullNotes(group[index].id, group[targetIdx].id);
  };

  const reorderFoldersList = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const fullIds = folders.map((f) => f.id);
    const fromIdx = fullIds.indexOf(sourceId);
    const toIdx = fullIds.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...fullIds];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await reorderFolders(next);
  };

  const getPlainExcerpt = (note: JournalNote): string => {
    if (note.locked && hasPin && !unlockedNoteIds.has(note.id)) {
      return 'Locked entry · Enter PIN to view';
    }
    const text = note.blocks
      .map((b) => b.html.replace(/<[^>]+>/g, ' ').trim())
      .filter(Boolean)
      .join(' · ');
    return text || 'Empty note — tap to start writing';
  };

  const filteredNotes = notes
    .filter((note) => {
      if (selectedFolderId === 'none' && note.folderId !== null) return false;
      if (
        selectedFolderId !== 'all' &&
        selectedFolderId !== 'none' &&
        note.folderId !== selectedFolderId
      ) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(q);
      const tagMatch = note.tags.some((t) => t.toLowerCase().includes(q));
      const bodyMatch =
        !(note.locked && !unlockedNoteIds.has(note.id)) &&
        note.blocks.some((b) => b.html.toLowerCase().includes(q));
      return titleMatch || tagMatch || bodyMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'custom') return 0; // preserve context custom sortOrder
      if (sortBy === 'title') {
        return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
      }
      if (sortBy === 'date') {
        return b.dateKey.localeCompare(a.dateKey) || b.updatedAt.localeCompare(a.updatedAt);
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const regularNotes = filteredNotes.filter((n) => !n.pinned);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {todayFormatted}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-zinc-100">
            {greetingName ? `${greetingName}’s Journal` : 'Journal'}
          </h1>
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} ·{' '}
            {folders.length} {folders.length === 1 ? 'folder' : 'folders'} ·{' '}
            {daysWithReadings} {daysWithReadings === 1 ? 'mood day' : 'mood days'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PWAInstallButton variant="compact" className="lg:hidden" />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 text-[#111111] dark:text-zinc-100 font-bold text-xs sm:text-sm flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            type="button"
            onClick={() => handleNewNote(false)}
            className="tactile-btn px-4 py-2.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-bold text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".md,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(e) => {
              handleImportTextNote(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PRIMARY SPOTLIGHT: Notes, Quick Write & Folders */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Write Spotlight Card */}
          <section
            className="tactile-card p-5 sm:p-6 text-[#111111] space-y-4"
            style={{ backgroundColor: JOURNAL_THEME.accentHex }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: JOURNAL_THEME.subTextOnAccent }}
                >
                  Notebook Spotlight
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                  What&apos;s on your mind?
                </h2>
                <p
                  className="text-xs sm:text-sm font-semibold"
                  style={{ color: JOURNAL_THEME.subTextOnAccent }}
                >
                  Write freely with blocks, checklists, voice memos, photos &amp; tags—saved offline on your device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openNewCheckIn()}
                className="px-3 py-1.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-xs font-extrabold flex items-center gap-1.5 hover:bg-zinc-50 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quick mood check-in
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleNewNote(false)}
                className="tactile-btn flex-1 min-w-[180px] py-3 px-4 rounded-xl bg-[#111111] text-white font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95"
              >
                <PenLine className="w-4 h-4" />
                Start writing a note
              </button>

              {NOTE_TEMPLATES.slice(0, 3).map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleNewFromTemplate(tpl.id)}
                  className="px-3.5 py-2.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-xs font-bold hover:bg-zinc-50 whitespace-nowrap"
                >
                  + {tpl.name}
                </button>
              ))}
            </div>
          </section>

          {/* Folders & Notes Header */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <h2 className="text-xl font-extrabold tracking-tight text-[#111111] dark:text-zinc-100">
              Notes &amp; Folders
            </h2>
            <button
              type="button"
              onClick={() => setNewFolderOpen((v) => !v)}
              className="px-3 py-1.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 text-[#111111] dark:text-zinc-100 text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New Folder
            </button>
          </div>

          {newFolderOpen && (
            <form onSubmit={handleCreateFolder} className="tactile-card-sm p-3 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g., Gratitude, Therapy, Ideas)"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-transparent text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 text-sm font-medium focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-xs font-bold"
              >
                Create
              </button>
            </form>
          )}

          {/* Folder Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedFolderId('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 whitespace-nowrap shrink-0 transition-colors ${
                selectedFolderId === 'all'
                  ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                  : 'bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
              }`}
            >
              All Notes ({notes.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedFolderId('none')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 whitespace-nowrap shrink-0 transition-colors ${
                selectedFolderId === 'none'
                  ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                  : 'bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
              }`}
            >
              No folder ({notes.filter((n) => n.folderId === null).length})
            </button>

            {folders.map((folder, folderIdx) => {
              const active = selectedFolderId === folder.id;
              const count = notes.filter((n) => n.folderId === folder.id).length;
              const isDragTarget = dragOverFolderId === folder.id && draggingFolderId !== folder.id;
              return (
                <div
                  key={folder.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggingFolderId(folder.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingFolderId && draggingFolderId !== folder.id) {
                      setDragOverFolderId(folder.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    if (draggingFolderId && draggingFolderId !== folder.id) {
                      await reorderFoldersList(draggingFolderId, folder.id);
                    }
                    setDraggingFolderId(null);
                    setDragOverFolderId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingFolderId(null);
                    setDragOverFolderId(null);
                  }}
                  className={`inline-flex items-center shrink-0 rounded-xl border-2 transition-all ${
                    isDragTarget
                      ? 'ring-2 ring-[#84C9A6] scale-105'
                      : ''
                  } ${
                    active
                      ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000]'
                      : 'bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-200 border-[#111111] dark:border-zinc-500 shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="pl-3 pr-1.5 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-3 h-3 opacity-45 shrink-0" />
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-[#111111] shrink-0"
                      style={{ backgroundColor: folder.color }}
                    />
                    <span>{folder.name}</span>
                    <span className="opacity-65">({count})</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setFolderMenuState({
                        folder,
                        index: folderIdx,
                        top: Math.min(rect.bottom + 6, window.innerHeight - 210),
                        left: Math.max(12, Math.min(rect.right - 192, window.innerWidth - 204)),
                      });
                    }}
                    aria-label={`Folder actions for ${folder.name}`}
                    className="pr-2 pl-1 py-2 opacity-75 hover:opacity-100 rounded-r-xl"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Search & Sort Row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes, blocks, or #tags..."
                className="tactile-card-sm w-full pl-10 pr-4 py-2.5 text-sm font-medium text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>

            <TactileSelect
              compact
              align="right"
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={(val) => setSortBy(val)}
              ariaLabel="Sort notes"
              className="sm:w-44"
            />
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="tactile-card p-8 text-center space-y-3 text-[#111111] dark:text-zinc-100">
              <p className="text-lg font-extrabold">No notes here yet</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Create a rich block note with checklists, callouts, photos, voice memos, or wiki-links.
              </p>
              <button
                type="button"
                onClick={() => handleNewNote(false)}
                className="tactile-btn px-5 py-2.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-bold text-sm"
              >
                Write First Note
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedNotes.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5" />
                    Pinned
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pinnedNotes.map((note, idx) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        folderName={folders.find((f) => f.id === note.folderId)?.name}
                        excerpt={getPlainExcerpt(note)}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < pinnedNotes.length - 1}
                        menuOpen={noteMenuId === note.id}
                        isDragging={draggingNoteId === note.id}
                        isDragOver={dragOverNoteId === note.id && draggingNoteId !== note.id}
                        onToggleMenu={() => setNoteMenuId((cur) => (cur === note.id ? null : note.id))}
                        onCloseMenu={() => setNoteMenuId(null)}
                        onShare={() => handleShareNoteCard(note)}
                        onRename={() => {
                          setNoteMenuId(null);
                          setRenameTarget({ type: 'note', id: note.id, value: note.title });
                        }}
                        onMoveUp={() => {
                          setNoteMenuId(null);
                          moveNoteInGroup(pinnedNotes, idx, -1);
                        }}
                        onMoveDown={() => {
                          setNoteMenuId(null);
                          moveNoteInGroup(pinnedNotes, idx, 1);
                        }}
                        onDelete={() => {
                          setNoteMenuId(null);
                          setDeleteTarget({
                            type: 'note',
                            id: note.id,
                            label: note.title || 'Untitled Note',
                          });
                        }}
                        onDragStart={() => setDraggingNoteId(note.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggingNoteId && draggingNoteId !== note.id) {
                            setDragOverNoteId(note.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverNoteId === note.id) setDragOverNoteId(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          if (draggingNoteId && draggingNoteId !== note.id) {
                            await reorderWithinFullNotes(draggingNoteId, note.id);
                          }
                          setDraggingNoteId(null);
                          setDragOverNoteId(null);
                        }}
                        onDragEnd={() => {
                          setDraggingNoteId(null);
                          setDragOverNoteId(null);
                        }}
                        onClick={() => handleOpenNoteCard(note)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {regularNotes.length > 0 && (
                <div className="space-y-2.5">
                  {pinnedNotes.length > 0 && (
                    <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                      All notes
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {regularNotes.map((note, idx) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        folderName={folders.find((f) => f.id === note.folderId)?.name}
                        excerpt={getPlainExcerpt(note)}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < regularNotes.length - 1}
                        menuOpen={noteMenuId === note.id}
                        isDragging={draggingNoteId === note.id}
                        isDragOver={dragOverNoteId === note.id && draggingNoteId !== note.id}
                        onToggleMenu={() => setNoteMenuId((cur) => (cur === note.id ? null : note.id))}
                        onCloseMenu={() => setNoteMenuId(null)}
                        onShare={() => handleShareNoteCard(note)}
                        onRename={() => {
                          setNoteMenuId(null);
                          setRenameTarget({ type: 'note', id: note.id, value: note.title });
                        }}
                        onMoveUp={() => {
                          setNoteMenuId(null);
                          moveNoteInGroup(regularNotes, idx, -1);
                        }}
                        onMoveDown={() => {
                          setNoteMenuId(null);
                          moveNoteInGroup(regularNotes, idx, 1);
                        }}
                        onDelete={() => {
                          setNoteMenuId(null);
                          setDeleteTarget({
                            type: 'note',
                            id: note.id,
                            label: note.title || 'Untitled Note',
                          });
                        }}
                        onDragStart={() => setDraggingNoteId(note.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggingNoteId && draggingNoteId !== note.id) {
                            setDragOverNoteId(note.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverNoteId === note.id) setDragOverNoteId(null);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          if (draggingNoteId && draggingNoteId !== note.id) {
                            await reorderWithinFullNotes(draggingNoteId, note.id);
                          }
                          setDraggingNoteId(null);
                          setDragOverNoteId(null);
                        }}
                        onDragEnd={() => {
                          setDraggingNoteId(null);
                          setDragOverNoteId(null);
                        }}
                        onClick={() => handleOpenNoteCard(note)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECONDARY COMPANION: Calendar + Selected Day Mood Summary */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-2.5">
            <h2 className="text-xl font-extrabold tracking-tight text-[#111111] dark:text-zinc-100">
              Calendar
            </h2>

            <section className="tactile-card p-4 sm:p-5 space-y-4 text-[#111111] dark:text-zinc-100">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                  className="w-10 h-10 rounded-xl border-2 border-[#111111] dark:border-zinc-500 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-base font-extrabold tracking-tight">
                  {formatMonthYear(calYear, calMonth)}
                </span>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                  className="w-10 h-10 rounded-xl border-2 border-[#111111] dark:border-zinc-500 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 text-center gap-y-2">
                {WEEKDAYS.map((w) => (
                  <span
                    key={w}
                    className="text-xs font-bold text-zinc-500 dark:text-zinc-400 pb-1"
                  >
                    {w}
                  </span>
                ))}

                {gridCells.map((dateKey, idx) => {
                  if (!dateKey) {
                    return <div key={`empty-${idx}`} className="h-10" />;
                  }
                  const dayNum = Number(dateKey.split('-')[2]);
                  const dayEntries = checkIns.filter((c) => c.dateKey === dateKey);
                  const dayNotesCount = notes.filter((n) => n.dateKey === dateKey).length;
                  const avg =
                    dayEntries.length > 0
                      ? roundMoodScore(
                          dayEntries.reduce((s, c) => s + c.moodScore, 0) / dayEntries.length
                        )
                      : null;
                  const avgMeta = avg ? getMoodMeta(avg) : null;
                  const isSelected = selectedJournalDate === dateKey;

                  return (
                    <div key={dateKey} className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setSelectedJournalDate(dateKey)}
                        style={
                          avgMeta
                            ? {
                                backgroundColor: avgMeta.bgHex,
                                color: avgMeta.isLightBg ? '#111111' : '#FFFFFF',
                              }
                            : undefined
                        }
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono tabular-nums transition-transform ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-[#111111] dark:ring-white dark:ring-offset-[#1B1B20] border-2 border-[#111111] scale-105'
                            : avgMeta
                            ? 'border-2 border-[#111111] dark:border-zinc-200'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {dayNum}
                        {dayNotesCount > 0 && (
                          <span className="absolute -bottom-1 right-1 w-2 h-2 rounded-full bg-[#111111] dark:bg-white border border-white dark:border-[#111111]" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Selected Day Summary Card */}
          <section
            className="tactile-card p-5 space-y-4 overflow-hidden text-[#111111] dark:text-zinc-100"
            style={
              selectedDayAvg
                ? {
                    backgroundColor: getMoodMeta(selectedDayAvg).bgHex,
                    color: getMoodMeta(selectedDayAvg).textHex,
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p
                  className="text-lg font-extrabold tracking-tight"
                  style={
                    selectedDayAvg
                      ? { color: getMoodMeta(selectedDayAvg).accentHex }
                      : undefined
                  }
                >
                  {formatLongDate(fromDateKey(selectedJournalDate))}
                </p>
                <p className="text-sm font-bold tabular-nums">
                  {selectedDayNotes.length}{' '}
                  {selectedDayNotes.length === 1 ? 'note' : 'notes'} ·{' '}
                  {selectedDayCheckIns.length}{' '}
                  {selectedDayCheckIns.length === 1 ? 'check-in' : 'check-ins'}
                </p>
                <p
                  className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                  style={
                    selectedDayAvg
                      ? { color: getMoodMeta(selectedDayAvg).accentHex }
                      : undefined
                  }
                >
                  {selectedDayAvg ? getMoodMeta(selectedDayAvg).label : 'Quiet day'}
                </p>
              </div>

              {selectedDayAvg && (
                <div className="-my-2 -mr-1 shrink-0">
                  <MoodCharacterSVG score={selectedDayAvg} size={102} withAura={false} />
                </div>
              )}
            </div>

            {selectedDayCheckIns.length > 0 && (
              <div className="space-y-1.5 bg-white/95 dark:bg-[#1B1B20]/95 text-[#111111] dark:text-zinc-100 rounded-xl p-3 border-2 border-[#111111]">
                {selectedDayCheckIns.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openEditCheckIn(c)}
                    className="w-full flex items-center justify-between gap-2 py-1.5 px-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MoodBadge score={c.moodScore} size={28} />
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {formatShortTime(c.timestamp)}
                      </span>
                      <span className="text-xs font-bold truncate">
                        {c.tags.length > 0 ? c.tags.slice(0, 3).join(' · ') : getMoodMeta(c.moodScore).label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleNewNote(true)}
                className="py-2.5 px-3 rounded-xl bg-[#111111] text-white border-2 border-[#111111] dark:border-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90"
              >
                <FileText className="w-3.5 h-3.5" />
                Write for day
              </button>
              <button
                type="button"
                onClick={() => openNewCheckIn(undefined, selectedJournalDate)}
                className="py-2.5 px-3 rounded-xl bg-white text-[#111111] border-2 border-[#111111] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Add check-in
              </button>
            </div>
          </section>
        </div>
      </div>

      <PinModal
        isOpen={!!pendingUnlockNoteId}
        mode="verify"
        onClose={() => setPendingUnlockNoteId(null)}
        onSubmit={async (pin) => {
          if (!pendingUnlockNoteId) return false;
          const ok = await unlockNoteWithPin(pendingUnlockNoteId, pin);
          if (ok) {
            const targetId = pendingUnlockNoteId;
            const purpose = pendingUnlockPurpose;
            setPendingUnlockNoteId(null);
            if (purpose === 'share') {
              const found = notes.find((n) => n.id === targetId) || null;
              if (found) setShareTargetNote(found);
            } else {
              openNote(targetId);
            }
          }
          return ok;
        }}
      />

      <ShareEntryModal
        note={shareTargetNote}
        mood={shareTargetNote ? resolveEntryMood(shareTargetNote, checkIns) : null}
        onClose={() => setShareTargetNote(null)}
      />

      {/* Fixed-anchor Folder 3-Dot Action Menu */}
      {folderMenuState && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setFolderMenuState(null)}
        >
          <div
            style={{ top: folderMenuState.top, left: folderMenuState.left }}
            onClick={(e) => e.stopPropagation()}
            className="tactile-card-sm fixed w-48 p-1.5 bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 space-y-0.5"
          >
            <button
              type="button"
              onClick={() => {
                const { folder } = folderMenuState;
                setFolderMenuState(null);
                setRenameTarget({ type: 'folder', id: folder.id, value: folder.name });
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Pencil className="w-3.5 h-3.5" />
              Rename folder
            </button>
            <button
              type="button"
              disabled={folderMenuState.index === 0}
              onClick={() => {
                const { index } = folderMenuState;
                setFolderMenuState(null);
                if (index > 0) reorderFoldersList(folders[index].id, folders[index - 1].id);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-35"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Move left
            </button>
            <button
              type="button"
              disabled={folderMenuState.index >= folders.length - 1}
              onClick={() => {
                const { index } = folderMenuState;
                setFolderMenuState(null);
                if (index < folders.length - 1) reorderFoldersList(folders[index].id, folders[index + 1].id);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-35"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Move right
            </button>
            <button
              type="button"
              onClick={() => {
                const { folder } = folderMenuState;
                setFolderMenuState(null);
                setDeleteTarget({ type: 'folder', id: folder.id, label: folder.name });
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete folder
            </button>
          </div>
        </div>
      )}

      {/* Rename Note / Folder Modal */}
      {renameTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setRenameTarget(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (renameTarget.type === 'folder') {
                if (!renameTarget.value.trim()) return;
                await renameFolder(renameTarget.id, renameTarget.value);
              } else {
                await renameNote(renameTarget.id, renameTarget.value);
              }
              setRenameTarget(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="tactile-card w-full max-w-sm p-6 space-y-4 text-[#111111] dark:text-zinc-100"
          >
            <h3 className="text-xl font-extrabold tracking-tight">
              {renameTarget.type === 'folder' ? 'Rename folder' : 'Rename note'}
            </h3>
            <input
              type="text"
              autoFocus
              value={renameTarget.value}
              onChange={(e) =>
                setRenameTarget((cur) => (cur ? { ...cur, value: e.target.value } : null))
              }
              placeholder={renameTarget.type === 'folder' ? 'Folder name...' : 'Note title...'}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-transparent text-sm font-bold focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="tactile-btn flex-1 py-2.5 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-sm"
              >
                Save Name
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Delete Note / Folder Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tactile-card w-full max-w-sm p-6 space-y-4 text-[#111111] dark:text-zinc-100"
          >
            <h3 className="text-xl font-extrabold tracking-tight">
              Delete {deleteTarget.type === 'folder' ? 'folder' : 'note'}?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {deleteTarget.type === 'folder'
                ? `Delete folder "${deleteTarget.label}"? Notes inside it will stay safe under "No folder".`
                : `Permanently delete "${deleteTarget.label}" from this device? This cannot be undone.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteTarget.type === 'folder') {
                    await deleteFolder(deleteTarget.id);
                    if (selectedFolderId === deleteTarget.id) setSelectedFolderId('all');
                  } else {
                    await deleteNote(deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }}
                className="tactile-btn flex-1 py-2.5 rounded-xl bg-[#E88B84] text-[#111111] font-extrabold text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NoteCard: React.FC<{
  note: JournalNote;
  folderName?: string;
  excerpt: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  menuOpen: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onShare: () => void;
  onRename: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onClick: () => void;
}> = ({
  note,
  folderName,
  excerpt,
  canMoveUp,
  canMoveDown,
  menuOpen,
  isDragging,
  isDragOver,
  onToggleMenu,
  onCloseMenu,
  onShare,
  onRename,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onClick,
}) => {
  const hasAudio = note.blocks.some((b) => b.type === 'voice');
  const hasPhoto = note.blocks.some((b) => b.type === 'photo');

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`tactile-card-sm relative p-4 text-left text-[#111111] dark:text-zinc-100 space-y-2.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer select-none ${
        isDragging ? 'opacity-50 scale-[0.98]' : ''
      } ${isDragOver ? 'ring-2 ring-[#84C9A6] ring-offset-2 dark:ring-offset-[#121215]' : ''}`}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripVertical className="w-3.5 h-3.5 text-zinc-400 shrink-0 cursor-grab" />
            <h3 className="font-note font-extrabold text-base tracking-tight line-clamp-1">
              {note.title || 'Untitled Note'}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-zinc-500 dark:text-zinc-400">
            {note.pinned && <Pin className="w-3.5 h-3.5" />}
            {note.locked && <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu();
              }}
              aria-label={`Actions for ${note.title || 'Untitled Note'}`}
              className="w-7 h-7 rounded-lg border border-transparent hover:border-[#111111] dark:hover:border-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-[#111111] dark:text-zinc-200"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="font-note text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {excerpt}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-1.5 truncate">
          <FolderIcon className="w-3 h-3 shrink-0" />
          <span className="truncate">{folderName || 'No folder'}</span>
          <span>·</span>
          <span className="font-mono tabular-nums">{note.dateKey}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasPhoto && <ImageIcon className="w-3.5 h-3.5" />}
          {hasAudio && <Mic className="w-3.5 h-3.5" />}
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              onCloseMenu();
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="tactile-card-sm absolute right-2 top-11 z-40 w-44 p-1.5 bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 space-y-0.5"
          >
            <button
              type="button"
              onClick={onShare}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Entry
            </button>
            <button
              type="button"
              onClick={onRename}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Pencil className="w-3.5 h-3.5" />
              Rename
            </button>
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-35"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Move up
            </button>
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-35"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              Move down
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};
