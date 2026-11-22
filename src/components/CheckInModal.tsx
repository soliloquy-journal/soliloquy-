import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ListChecks,
  Camera,
  Image as ImageIcon,
  PenLine,
  Trash2,
  Clock,
  Check,
  Sparkles,
} from 'lucide-react';
import { MOODS, TAG_CATEGORIES, getMoodMeta, normalizeMoodScore } from '../constants/moods';
import { useJournal } from '../context/JournalContext';
import type { MoodScore, TagCategory } from '../types/journal';
import { toDateKey } from '../utils/dateUtils';
import { MoodBadge, MoodCharacterSVG } from './MoodCharacters';

const ORDERED_SCORES: MoodScore[] = [1, 2, 3, 4, 5, 6];

export const CheckInModal: React.FC = () => {
  const {
    checkInModalOpen,
    editingCheckIn,
    closeCheckInModal,
    saveCheckIn,
    deleteCheckIn,
    customTags,
    setCustomTagsModalOpen,
    createNote,
    openNote,
    showToast,
  } = useJournal();

  const [step, setStep] = useState<1 | 2>(1);
  const [moodScore, setMoodScore] = useState<MoodScore>(5);
  const [timestamp, setTimestamp] = useState<Date>(new Date());
  const [showEarlier, setShowEarlier] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<TagCategory>('Mindset');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [showPhotoBox, setShowPhotoBox] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!checkInModalOpen) return;
    setStep(1);
    setSearchQuery('');
    if (editingCheckIn) {
      setMoodScore(normalizeMoodScore(editingCheckIn.moodScore));
      setTimestamp(new Date(editingCheckIn.timestamp));
      setSelectedTags(editingCheckIn.tags);
      setQuickNote(editingCheckIn.quickNote || '');
      setPhotoDataUrl(editingCheckIn.photoDataUrl);
      setShowNoteBox(!!editingCheckIn.quickNote);
      setShowPhotoBox(!!editingCheckIn.photoDataUrl);
      setShowEarlier(false);
    } else {
      setMoodScore(5);
      setTimestamp(new Date());
      setSelectedTags([]);
      setQuickNote('');
      setPhotoDataUrl(undefined);
      setShowNoteBox(false);
      setShowPhotoBox(false);
      setShowEarlier(false);
    }
  }, [checkInModalOpen, editingCheckIn]);

  if (!checkInModalOpen) return null;

  const mood = getMoodMeta(moodScore);
  const activeCustomTags = customTags.filter((t) => !t.archived);

  const allCategories: { category: TagCategory; tags: string[] }[] = [
    ...TAG_CATEGORIES,
    ...(activeCustomTags.length > 0
      ? [{ category: 'Yours' as TagCategory, tags: activeCustomTags.map((t) => t.label) }]
      : []),
  ];

  const isTodayDate = toDateKey(timestamp) === toDateKey(new Date());
  const formattedTime = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateLabel = isTodayDate ? 'Today' : toDateKey(timestamp);

  const shiftMinutes = (deltaMins: number) => {
    setTimestamp((prev) => new Date(prev.getTime() + deltaMins * 60 * 1000));
  };

  const setDay = (which: 'yesterday' | 'today') => {
    const now = new Date();
    const target = new Date(timestamp);
    if (which === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      target.setFullYear(yest.getFullYear(), yest.getMonth(), yest.getDate());
    } else {
      target.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    }
    setTimestamp(target);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
        setShowPhotoBox(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (launchRichEditor = false) => {
    setSaving(true);
    try {
      const existingId = editingCheckIn?.id ? editingCheckIn.id : undefined;
      const saved = await saveCheckIn(
        {
          moodScore,
          timestamp: timestamp.toISOString(),
          dateKey: toDateKey(timestamp),
          tags: selectedTags,
          quickNote: quickNote.trim() || undefined,
          photoDataUrl,
          linkedNoteId: editingCheckIn?.linkedNoteId,
        },
        existingId
      );

      if (launchRichEditor) {
        if (saved.linkedNoteId) {
          closeCheckInModal();
          openNote(saved.linkedNoteId);
          return;
        }
        const richNote = await createNote({
          title: `${mood.label} — ${formatTimeLabel(timestamp)}`,
          dateKey: saved.dateKey,
          linkedCheckInId: saved.id,
          tags: selectedTags,
          blocks: [
            {
              id: crypto.randomUUID(),
              type: 'mood',
              html: mood.label,
              moodScore: saved.moodScore,
            },
            {
              id: crypto.randomUUID(),
              type: 'paragraph',
              html: quickNote.trim() || '',
            },
          ],
        });
        await saveCheckIn(
          {
            moodScore: saved.moodScore,
            timestamp: saved.timestamp,
            dateKey: saved.dateKey,
            tags: saved.tags,
            quickNote: saved.quickNote,
            photoDataUrl: saved.photoDataUrl,
            linkedNoteId: richNote.id,
          },
          saved.id
        );
        closeCheckInModal();
        openNote(richNote.id);
        return;
      }

      closeCheckInModal();
    } catch {
      showToast('Could not save check-in', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCheckIn?.id) return;
    await deleteCheckIn(editingCheckIn.id);
    closeCheckInModal();
  };

  const searchResults = searchQuery.trim()
    ? Array.from(
        new Set(
          allCategories
            .flatMap((c) => c.tags)
            .filter((t) => t.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        )
      )
    : [];

  const currentCategoryTags =
    allCategories.find((c) => c.category === activeCategory)?.tags || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      onClick={closeCheckInModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl my-auto rounded-xl border-2 border-[#111111] dark:border-zinc-200 bg-[#FFFDF9] dark:bg-[#18181E] text-[#111111] dark:text-zinc-100 shadow-[6px_6px_0px_#111111] dark:shadow-[6px_6px_0px_#000000] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Studio Header */}
        <header className="px-4 sm:px-5 py-3.5 border-b-2 border-[#111111] dark:border-zinc-700 bg-white dark:bg-[#1E1E25] flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : closeCheckInModal())}
            aria-label={step === 2 ? 'Back to step 1' : 'Close check-in'}
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#26262F] text-[#111111] dark:text-zinc-100 border-2 border-[#111111] dark:border-zinc-400 shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:translate-x-[1px] active:translate-y-[1px]"
          >
            {step === 2 ? <ChevronLeft className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>

          {/* Clickable 2-Step Studio Switcher */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#121216] p-1 rounded-xl border-2 border-[#111111] dark:border-zinc-600">
            <button
              type="button"
              onClick={() => setStep(1)}
              style={step === 1 ? { backgroundColor: mood.bgHex, color: '#111111' } : undefined}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                step === 1
                  ? 'border border-[#111111] shadow-[1px_1px_0px_#111111]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              <span className="font-mono">1</span>
              <span>Mood</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={step === 2 ? { backgroundColor: mood.bgHex, color: '#111111' } : undefined}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                step === 2
                  ? 'border border-[#111111] shadow-[1px_1px_0px_#111111]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              <span className="font-mono">2</span>
              <span>Context</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {editingCheckIn?.id && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete check-in"
                title="Delete check-in"
                className="w-10 h-10 rounded-xl bg-[#E88B84]/30 text-[#AD4942] dark:text-[#E88B84] border-2 border-[#111111] dark:border-zinc-400 flex items-center justify-center hover:bg-[#E88B84]/50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-[#26262F] border border-[#111111]/25 dark:border-zinc-600 font-mono text-xs font-extrabold tabular-nums">
              {step}/2
            </span>
          </div>
        </header>

        {/* STEP 1: Creative Mood Studio */}
        {step === 1 && (
          <div className="overflow-y-auto flex-1 flex flex-col">
            {/* Dynamic Tinted Mood Showcase Banner */}
            <div
              className="px-5 py-5 sm:px-6 sm:py-6 border-b-2 border-[#111111] dark:border-zinc-700 transition-colors duration-200 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ backgroundColor: mood.bgHex, color: mood.textHex }}
            >
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/85 text-[#111111] border border-[#111111] text-[11px] font-extrabold uppercase tracking-wider">
                    {editingCheckIn ? 'Editing Check-in' : 'Mood Pulse'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEarlier((v) => !v)}
                    className="px-2.5 py-0.5 rounded-lg bg-[#111111]/10 hover:bg-[#111111]/20 text-[#111111] border border-[#111111]/30 text-[11px] font-extrabold inline-flex items-center gap-1 transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      {dateLabel} · {formattedTime}
                    </span>
                    <span className="underline underline-offset-2 ml-0.5">
                      {showEarlier ? 'Done' : 'Adjust'}
                    </span>
                  </button>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111111]">
                  How are you feeling?
                </h1>

                <div className="flex items-baseline justify-center sm:justify-start gap-2.5">
                  <p
                    className="font-display text-3xl sm:text-4xl font-black tracking-tight uppercase"
                    style={{ color: mood.accentHex }}
                  >
                    {mood.label}
                  </p>
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-white/75 text-[#111111] border border-[#111111]">
                    {moodScore}/6
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <MoodCharacterSVG score={moodScore} size={136} withAura={true} />
              </div>
            </div>

            {/* Studio Controls Body */}
            <div className="p-5 sm:p-6 space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Inline Time Shift Box when open */}
                {showEarlier && (
                  <div className="p-4 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-zinc-50 dark:bg-[#22222A] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Check-in timestamp
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTimestamp(new Date());
                          setShowEarlier(false);
                        }}
                        className="text-xs font-extrabold underline underline-offset-4 hover:opacity-80"
                      >
                        Back to now
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDay('yesterday')}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border-2 border-[#111111] dark:border-zinc-400 transition-colors ${
                          !isTodayDate
                            ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                            : 'bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100'
                        }`}
                      >
                        Yesterday
                      </button>
                      <button
                        type="button"
                        onClick={() => setDay('today')}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border-2 border-[#111111] dark:border-zinc-400 transition-colors ${
                          isTodayDate
                            ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                            : 'bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100'
                        }`}
                      >
                        Today
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => shiftMinutes(-15)}
                        className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100 border-2 border-[#111111] dark:border-zinc-500 shadow-[2px_2px_0px_#111111] text-xs font-extrabold flex items-center justify-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        15m earlier
                      </button>
                      <span className="font-mono text-base font-extrabold px-2 tabular-nums">
                        {formattedTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => shiftMinutes(15)}
                        className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100 border-2 border-[#111111] dark:border-zinc-500 shadow-[2px_2px_0px_#111111] text-xs font-extrabold flex items-center justify-center gap-1"
                      >
                        15m later
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tactile 6-Point Slider */}
                <div className="space-y-2">
                  <div className="relative h-14 flex items-center">
                    <div className="w-full h-7 rounded-xl border-2 border-[#111111] dark:border-zinc-300 shadow-[2px_2px_0px_#111111] flex items-center justify-between px-4 relative overflow-hidden bg-zinc-100 dark:bg-[#25252E]">
                      <div
                        className="absolute left-0 top-0 bottom-0 transition-all duration-150 border-r-2 border-[#111111]"
                        style={{
                          width: `calc(20px + (100% - 40px) * ${(moodScore - 1) / 5})`,
                          backgroundColor: mood.bgHex,
                        }}
                      />
                      {ORDERED_SCORES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMoodScore(s)}
                          aria-label={`Select mood ${s} of 6: ${MOODS[s].label}`}
                          className="relative z-10 w-6 h-7 flex items-center justify-center"
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-sm border transition-all duration-150 ${
                              s === moodScore
                                ? 'opacity-0 scale-0'
                                : 'bg-white border-[#111111]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    {/* Active Thumb cleanly above track step dots */}
                    <div
                      className="pointer-events-none z-20 absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150"
                      style={{ left: `calc(20px + (100% - 40px) * ${(moodScore - 1) / 5})` }}
                    >
                      <MoodBadge score={moodScore} size={46} />
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={moodScore}
                      onChange={(e) => setMoodScore(Number(e.target.value) as MoodScore)}
                      aria-label="Mood score slider"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                    />
                  </div>
                </div>

                {/* 6-Tile Quick-Pick Mood Matrix */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-zinc-500 dark:text-zinc-400">
                    <span>Quick pick</span>
                    {!showEarlier && (
                      <button
                        type="button"
                        onClick={() => setShowEarlier(true)}
                        className="underline underline-offset-4 text-[#111111] dark:text-zinc-200 hover:opacity-80"
                      >
                        Earlier?
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {ORDERED_SCORES.map((s) => {
                      const item = MOODS[s];
                      const active = s === moodScore;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMoodScore(s)}
                          style={
                            active
                              ? { backgroundColor: item.bgHex, color: '#111111' }
                              : undefined
                          }
                          className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                            active
                              ? 'border-[#111111] shadow-[3px_3px_0px_#111111] -translate-y-0.5'
                              : 'border-[#111111]/25 dark:border-zinc-600 bg-white dark:bg-[#22222A] hover:border-[#111111] dark:hover:border-zinc-300'
                          }`}
                        >
                          <MoodBadge score={s} size={28} />
                          <span className="text-[11px] font-extrabold leading-tight text-center">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  className="px-4 py-3.5 rounded-xl border-2 border-[#111111] dark:border-zinc-400 bg-white dark:bg-[#22222A] text-[#111111] dark:text-zinc-100 font-extrabold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0"
                >
                  {saving ? 'Saving...' : 'Quick Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{ backgroundColor: mood.bgHex, color: '#111111' }}
                  className="tactile-btn flex-1 py-3.5 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  <span>Next: Add Context</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Context, Tags, Quick Note & Photo */}
        {step === 2 && (
          <div className="overflow-y-auto flex-1 flex flex-col">
            {/* Compact Selected Mood Ribbon */}
            <div
              className="px-5 py-3 border-b-2 border-[#111111] dark:border-zinc-700 flex items-center justify-between gap-3 shrink-0"
              style={{ backgroundColor: mood.bgHex, color: '#111111' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <MoodBadge score={moodScore} size={38} />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold opacity-80 truncate">
                    {dateLabel} · {formattedTime}
                  </p>
                  <p className="text-lg font-extrabold tracking-tight leading-tight">
                    {mood.label}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-xl bg-white/90 text-[#111111] border-2 border-[#111111] text-xs font-extrabold hover:bg-white shrink-0"
              >
                Change mood
              </button>
            </div>

            {/* Context Builder Studio */}
            <div className="p-5 sm:p-6 space-y-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      What shaped this moment?
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                      Pick tags that fit, or skip straight to save.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCustomTagsModalOpen(true)}
                    title="Manage your own tags"
                    aria-label="Manage your own tags"
                    className="w-10 h-10 rounded-xl bg-white dark:bg-[#25252D] text-[#111111] dark:text-zinc-100 border-2 border-[#111111] dark:border-zinc-400 shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <ListChecks className="w-4 h-4" />
                  </button>
                </div>

                {/* Selected Tags Tray */}
                {selectedTags.length > 0 && (
                  <div className="p-3 rounded-xl border-2 border-[#111111]/25 dark:border-zinc-700 bg-zinc-50 dark:bg-[#202028] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      <span>Selected ({selectedTags.length})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTags([])}
                        className="underline underline-offset-2 hover:text-[#111111] dark:hover:text-white"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          style={{ backgroundColor: mood.bgHex, color: '#111111' }}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold border-2 border-[#111111] flex items-center gap-1 shadow-[1px_1px_0px_#111111]"
                        >
                          <span>{tag}</span>
                          <X className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search tags */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter tags: walk, meeting, sleep..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#111111]/35 dark:border-zinc-600 bg-white dark:bg-[#22222A] text-sm font-semibold text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#111111] dark:focus:border-white"
                  />
                </div>

                {/* Category Chips or Search Results */}
                {!searchQuery.trim() ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {allCategories.map((c) => {
                        const active = activeCategory === c.category;
                        return (
                          <button
                            key={c.category}
                            type="button"
                            onClick={() => setActiveCategory(c.category)}
                            style={
                              active
                                ? { backgroundColor: mood.bgHex, color: '#111111' }
                                : undefined
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 border-2 transition-all ${
                              active
                                ? 'border-[#111111] shadow-[2px_2px_0px_#111111]'
                                : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#22222A] text-zinc-600 dark:text-zinc-300 hover:border-[#111111]'
                            }`}
                          >
                            {c.category}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto py-0.5 pr-1">
                      {currentCategoryTags.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            style={
                              active
                                ? { backgroundColor: mood.bgHex, color: '#111111' }
                                : undefined
                            }
                            className={`px-3.5 py-2 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all ${
                              active
                                ? 'border-[#111111] shadow-[2px_2px_0px_#111111]'
                                : 'border-[#111111]/25 dark:border-zinc-600 bg-white dark:bg-[#22222A] text-[#111111] dark:text-zinc-100 hover:border-[#111111] dark:hover:border-zinc-300'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto py-0.5">
                    {searchResults.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No matching tags. Add custom ones via the list button above.
                      </p>
                    ) : (
                      searchResults.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            style={
                              active
                                ? { backgroundColor: mood.bgHex, color: '#111111' }
                                : undefined
                            }
                            className={`px-3.5 py-2 rounded-xl border-2 text-xs sm:text-sm font-bold ${
                              active
                                ? 'border-[#111111] shadow-[2px_2px_0px_#111111]'
                                : 'border-[#111111]/25 dark:border-zinc-600 bg-white dark:bg-[#22222A] text-[#111111] dark:text-zinc-100'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Quick Note & Photo Cards */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNoteBox((v) => !v)}
                    className={`py-2.5 px-3.5 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      showNoteBox
                        ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] shadow-[2px_2px_0px_#111111]'
                        : 'bg-white dark:bg-[#22222A] text-[#111111] dark:text-zinc-100 border-[#111111]/35 dark:border-zinc-600 hover:border-[#111111]'
                    }`}
                  >
                    <PenLine className="w-4 h-4" />
                    A note
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPhotoBox((v) => !v)}
                    className={`py-2.5 px-3.5 rounded-xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      showPhotoBox
                        ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] shadow-[2px_2px_0px_#111111]'
                        : 'bg-white dark:bg-[#22222A] text-[#111111] dark:text-zinc-100 border-[#111111]/35 dark:border-zinc-600 hover:border-[#111111]'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    A photo
                  </button>
                </div>

                {showNoteBox && (
                  <div className="p-3.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-[#22222A] space-y-2.5">
                    <textarea
                      rows={3}
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      placeholder="Anything you want to remember (optional)..."
                      className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-[#18181E] text-sm text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#111111]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold underline underline-offset-4 hover:opacity-80"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Save &amp; write in full Rich Block Editor →
                    </button>
                  </div>
                )}

                {showPhotoBox && (
                  <div className="p-3.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-[#22222A] space-y-2.5">
                    {photoDataUrl ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-[#111111] max-h-48">
                        <img
                          src={photoDataUrl}
                          alt="Check-in attachment"
                          className="w-full h-44 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPhotoDataUrl(undefined)}
                          aria-label="Remove photo"
                          className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/80 text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="py-2.5 px-3 rounded-xl border-2 border-[#111111]/40 dark:border-zinc-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:border-[#111111] dark:hover:border-white"
                        >
                          <Camera className="w-4 h-4" />
                          Take a photo
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="py-2.5 px-3 rounded-xl border-2 border-[#111111]/40 dark:border-zinc-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:border-[#111111] dark:hover:border-white"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Choose a photo
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Your photo stays privately on this device and is included in your JSON backups.
                    </p>
                  </div>
                )}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                />
              </div>

              {/* Save Bar */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-[#22222A] font-extrabold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  style={{ backgroundColor: mood.bgHex, color: '#111111' }}
                  className="tactile-btn flex-1 py-3.5 rounded-xl font-extrabold text-base flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[2.75]" />
                  <span>{saving ? 'Saving...' : 'Save Check-in'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function formatTimeLabel(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
