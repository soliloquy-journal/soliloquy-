import React, { useEffect, useRef, useState } from 'react';
import {
  Info,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  Pencil,
  StickyNote,
  MessageSquareQuote,
  KeyRound,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Star,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Hourglass,
  Calendar,
} from 'lucide-react';
import { MOODS, STICKER_PACK, WASHI_VARIANTS, getMoodMeta, normalizeMoodScore } from '../../constants/moods';
import type { CalloutVariant, EditorBlock, MoodScore } from '../../types/journal';
import { MoodBadge } from '../MoodCharacters';
import { TactileSelect } from '../TactileSelect';

interface BlockRendererProps {
  block: EditorBlock;
  numberIndex: number;
  reorderMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (updated: EditorBlock) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onEnterNewBlock: () => void;
  onOpenWikiLink: (rect?: DOMRect) => void;
  onOpenNoteById: (noteId: string) => void;
  onFocusBlock: (blockId: string) => void;
}

const CALLOUT_CONFIG: Record<
  CalloutVariant,
  { label: string; bg: string; iconColor: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  info: { label: 'Info', bg: 'bg-blue-50 dark:bg-blue-950/35 border-blue-200 dark:border-blue-800', iconColor: 'text-blue-600 dark:text-blue-400', Icon: Info },
  tip: { label: 'Tip', bg: 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800', iconColor: 'text-emerald-600 dark:text-emerald-400', Icon: Lightbulb },
  success: { label: 'Success', bg: 'bg-green-50 dark:bg-green-950/35 border-green-200 dark:border-green-800', iconColor: 'text-green-600 dark:text-green-400', Icon: CheckCircle2 },
  warning: { label: 'Warning', bg: 'bg-amber-50 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800', iconColor: 'text-amber-600 dark:text-amber-400', Icon: AlertTriangle },
  danger: { label: 'Danger', bg: 'bg-red-50 dark:bg-red-950/35 border-red-200 dark:border-red-800', iconColor: 'text-red-600 dark:text-red-400', Icon: OctagonAlert },
  note: { label: 'Note', bg: 'bg-purple-50 dark:bg-purple-950/35 border-purple-200 dark:border-purple-800', iconColor: 'text-purple-600 dark:text-purple-400', Icon: Pencil },
  sticky: { label: 'Sticky note', bg: 'bg-yellow-50 dark:bg-yellow-950/35 border-yellow-300 dark:border-yellow-700', iconColor: 'text-yellow-700 dark:text-yellow-400', Icon: StickyNote },
  quotecard: { label: 'Quote card', bg: 'bg-violet-50 dark:bg-violet-950/35 border-violet-200 dark:border-violet-800', iconColor: 'text-violet-600 dark:text-violet-400', Icon: MessageSquareQuote },
  keyidea: { label: 'Key idea', bg: 'bg-sky-50 dark:bg-sky-950/35 border-sky-200 dark:border-sky-800', iconColor: 'text-sky-600 dark:text-sky-400', Icon: KeyRound },
};

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  numberIndex,
  reorderMode,
  isFirst,
  isLast,
  onChange,
  onDelete,
  onMove,
  onEnterNewBlock,
  onOpenWikiLink,
  onOpenNoteById,
  onFocusBlock,
}) => {
  const editableRef = useRef<HTMLDivElement>(null);

  // Sync external html changes only when element isn't actively focused
  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerHTML !== block.html) {
      el.innerHTML = block.html;
    }
  }, [block.html, block.id]);

  const handleEditableInput = () => {
    const el = editableRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const text = el.textContent || '';
    if (text.endsWith('[[')) {
      onOpenWikiLink(el.getBoundingClientRect());
    }
    onChange({ ...block, html });
  };

  const handleEditableClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const linkEl = target.closest('[data-note-id]') as HTMLElement | null;
    if (linkEl) {
      e.preventDefault();
      const id = linkEl.getAttribute('data-note-id');
      if (id) onOpenNoteById(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      onEnterNewBlock();
    } else if (
      e.key === 'Backspace' &&
      (editableRef.current?.textContent || '').length === 0 &&
      block.type !== 'paragraph'
    ) {
      e.preventDefault();
      onChange({ ...block, type: 'paragraph' });
    }
  };

  const alignClass =
    block.align === 'center'
      ? 'text-center'
      : block.align === 'right'
      ? 'text-right'
      : 'text-left';

  const wrapWithReorderControls = (inner: React.ReactNode) => (
    <div className={`group relative flex items-start gap-2 ${reorderMode ? 'py-1 px-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700' : ''}`}>
      <div className="flex-1 min-w-0">{inner}</div>
      {reorderMode && (
        <div className="flex items-center gap-1 shrink-0 pt-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label="Move block up"
            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 disabled:opacity-30"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label="Move block down"
            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 disabled:opacity-30"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete block"
            className="p-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  // Text-based blocks
  const renderEditable = (extraClass: string, placeholder: string) => (
    <div
      ref={editableRef}
      contentEditable
      suppressContentEditableWarning
      dir={block.dir || 'ltr'}
      data-placeholder={placeholder}
      onFocus={() => onFocusBlock(block.id)}
      onInput={handleEditableInput}
      onClick={handleEditableClick}
      onKeyDown={handleKeyDown}
      className={`outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 break-words ${alignClass} ${extraClass}`}
    />
  );

  switch (block.type) {
    case 'h1':
      return wrapWithReorderControls(
        renderEditable('font-display text-3xl font-extrabold tracking-tight py-1', 'Heading 1')
      );
    case 'h2':
      return wrapWithReorderControls(
        renderEditable('font-display text-2xl font-extrabold tracking-tight py-1', 'Heading 2')
      );
    case 'h3':
      return wrapWithReorderControls(
        renderEditable('font-display text-xl font-bold tracking-tight py-0.5', 'Heading 3')
      );
    case 'quote':
      return wrapWithReorderControls(
        <div className="px-4 py-2.5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 italic text-zinc-700 dark:text-zinc-300">
          {renderEditable('text-base leading-relaxed', 'Quote...')}
        </div>
      );
    case 'pullquote':
      return wrapWithReorderControls(
        <div className="py-4 px-5 text-center border-y border-zinc-200 dark:border-zinc-700 my-1">
          {renderEditable('font-display text-xl font-bold tracking-tight italic', 'Pull quote...')}
        </div>
      );
    case 'code':
      return wrapWithReorderControls(
        <div className="p-3.5 rounded-2xl bg-zinc-900 text-emerald-300 font-mono text-sm overflow-x-auto border border-zinc-700">
          {renderEditable('whitespace-pre-wrap', '// code snippet...')}
        </div>
      );
    case 'checklist':
      return wrapWithReorderControls(
        <div className="flex items-start gap-2.5 py-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...block, checked: !block.checked })}
            aria-label="Toggle checklist item"
            className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
              block.checked
                ? 'bg-[#111111] border-[#111111] text-white dark:bg-white dark:border-white dark:text-[#111111]'
                : 'border-zinc-400 dark:border-zinc-500'
            }`}
          >
            {block.checked && <span className="text-xs font-bold">✓</span>}
          </button>
          <div className={`flex-1 min-w-0 ${block.checked ? 'line-through opacity-55' : ''}`}>
            {renderEditable('text-base leading-relaxed', 'To-do item...')}
          </div>
        </div>
      );
    case 'bullet':
      return wrapWithReorderControls(
        <div className="flex items-start gap-2.5 py-0.5">
          <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-75" />
          <div className="flex-1 min-w-0">
            {renderEditable('text-base leading-relaxed', 'List item...')}
          </div>
        </div>
      );
    case 'numbered':
      return wrapWithReorderControls(
        <div className="flex items-start gap-2.5 py-0.5">
          <span className="font-mono text-sm font-bold mt-0.5 opacity-70 tabular-nums shrink-0">
            {numberIndex}.
          </span>
          <div className="flex-1 min-w-0">
            {renderEditable('text-base leading-relaxed', 'Numbered item...')}
          </div>
        </div>
      );
    case 'toggle':
      return wrapWithReorderControls(
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 p-3 space-y-2 bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...block, toggleOpen: !block.toggleOpen })}
              aria-label="Toggle section"
              className="p-1 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
            >
              {block.toggleOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div className="flex-1 font-bold">
              {renderEditable('text-base', 'Toggle heading...')}
            </div>
          </div>
          {block.toggleOpen && (
            <textarea
              rows={2}
              value={block.childrenHtml || ''}
              onChange={(e) => onChange({ ...block, childrenHtml: e.target.value })}
              placeholder="Write hidden toggle details..."
              className="w-full pl-7 pr-2 py-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none resize-y"
            />
          )}
        </div>
      );
    case 'callout': {
      const variant = block.calloutVariant || 'info';
      const cfg = CALLOUT_CONFIG[variant];
      const Icon = cfg.Icon;
      return wrapWithReorderControls(
        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${cfg.bg}`}>
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className={`text-[11px] font-extrabold uppercase tracking-wider ${cfg.iconColor}`}>
              {cfg.label}
            </p>
            {renderEditable('text-sm leading-relaxed', `Write ${cfg.label.toLowerCase()}...`)}
          </div>
        </div>
      );
    }
    case 'voice':
      return wrapWithReorderControls(
        <VoicePlayerBlock
          audioDataUrl={block.audioDataUrl}
          duration={block.audioDuration || 0}
        />
      );
    case 'photo':
      return wrapWithReorderControls(
        <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
          {block.photoDataUrl ? (
            <img
              src={block.photoDataUrl}
              alt={block.photoCaption || 'Journal photo'}
              className="w-full max-h-96 object-cover"
            />
          ) : (
            <div className="p-6 text-center text-sm text-zinc-500">No photo selected</div>
          )}
          <input
            type="text"
            value={block.photoCaption || ''}
            onChange={(e) => onChange({ ...block, photoCaption: e.target.value })}
            placeholder="Add a caption..."
            className="w-full px-3.5 py-2 text-xs font-medium bg-transparent border-t border-zinc-200 dark:border-zinc-800 focus:outline-none"
          />
        </div>
      );
    case 'divider':
      return wrapWithReorderControls(<DividerBlock style={block.dividerStyle || 'thick'} />);
    case 'table':
    case 'sheet':
      return wrapWithReorderControls(
        <TableSheetBlock
          isSheet={block.type === 'sheet'}
          data={
            block.tableData || [
              ['Item', 'Notes', 'Value'],
              ['Morning walk', 'Sunny', '30'],
            ]
          }
          onChange={(tableData) => onChange({ ...block, tableData })}
        />
      );
    case 'chart':
      return wrapWithReorderControls(
        <InlineChartBlock
          title={block.chartTitle || 'Weekly Energy'}
          data={
            block.chartData || [
              { label: 'Mon', value: 4 },
              { label: 'Tue', value: 6 },
              { label: 'Wed', value: 5 },
              { label: 'Thu', value: 7 },
            ]
          }
          onChange={(chartTitle, chartData) => onChange({ ...block, chartTitle, chartData })}
        />
      );
    case 'sticker':
      return wrapWithReorderControls(
        <StickerBlock
          stickerId={block.stickerId || 'sunbeam'}
          onSelect={(stickerId) => onChange({ ...block, stickerId })}
        />
      );
    case 'washi':
      return wrapWithReorderControls(
        <WashiTapeBlock
          label={block.html}
          variant={block.washiVariant || 'mint'}
          onChange={(html, washiVariant) => onChange({ ...block, html, washiVariant })}
        />
      );
    case 'countdown':
      return wrapWithReorderControls(
        <CountdownBlock
          title={block.countdownTitle || 'Target Day'}
          date={block.countdownDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}
          onChange={(countdownTitle, countdownDate) =>
            onChange({ ...block, countdownTitle, countdownDate })
          }
        />
      );
    case 'date':
      return wrapWithReorderControls(
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <input
            type="date"
            value={block.dateValue || new Date().toISOString().slice(0, 10)}
            onChange={(e) => onChange({ ...block, dateValue: e.target.value })}
            className="bg-transparent text-sm font-mono font-bold focus:outline-none"
          />
        </div>
      );
    case 'mood': {
      const mScore = normalizeMoodScore(block.moodScore || 5);
      const mMeta = getMoodMeta(mScore);
      return wrapWithReorderControls(
        <div className="p-3 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MoodBadge score={mScore} size={32} />
            <span className="font-bold text-sm">Mood: {mMeta.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {([1, 2, 3, 4, 5, 6] as MoodScore[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...block, moodScore: s, html: MOODS[s].label })}
                style={{ backgroundColor: MOODS[s].bgHex }}
                title={MOODS[s].label}
                className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                  mScore === s
                    ? 'border-[#111111] dark:border-white scale-110 shadow-[2px_2px_0px_#111111]'
                    : 'border-[#111111]/40 opacity-65 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>
      );
    }
    case 'rating': {
      const val = block.ratingValue ?? 4;
      return wrapWithReorderControls(
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
          <input
            type="text"
            value={block.html}
            onChange={(e) => onChange({ ...block, html: e.target.value })}
            placeholder="Rating label..."
            className="bg-transparent text-sm font-bold focus:outline-none flex-1 min-w-0"
          />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onChange({ ...block, ratingValue: star })}
                aria-label={`Rate ${star} of 5`}
                className="p-0.5"
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= val
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-zinc-300 dark:text-zinc-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      );
    }
    case 'dropdown': {
      const options = block.dropdownOptions || ['Planned', 'In Progress', 'Done'];
      const current = block.dropdownValue || options[0];
      return wrapWithReorderControls(
        <DropdownBlockInner
          options={options}
          current={current}
          onChangeValue={(dropdownValue) => onChange({ ...block, dropdownValue })}
          onChangeOptions={(parsed) =>
            onChange({
              ...block,
              dropdownOptions: parsed,
              dropdownValue: parsed.includes(current) ? current : parsed[0],
            })
          }
        />
      );
    }
    default:
      return wrapWithReorderControls(
        renderEditable('text-base leading-relaxed', 'Start writing...')
      );
  }
};

const DropdownBlockInner: React.FC<{
  options: string[];
  current: string;
  onChangeValue: (val: string) => void;
  onChangeOptions: (opts: string[]) => void;
}> = ({ options, current, onChangeValue, onChangeOptions }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(options.join(', '));

  return (
    <div className="space-y-2 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <TactileSelect
          compact
          value={current}
          options={options.map((opt) => ({ value: opt, label: opt }))}
          onChange={onChangeValue}
          ariaLabel="Block dropdown choice"
          className="min-w-[160px]"
        />
        <button
          type="button"
          onClick={() => {
            setDraft(options.join(', '));
            setEditing((v) => !v);
          }}
          className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white px-2 py-1"
        >
          {editing ? 'Close' : 'Edit choices'}
        </button>
      </div>
      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = draft
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            if (parsed.length > 0) {
              onChangeOptions(parsed);
            }
            setEditing(false);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Comma-separated choices..."
            className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-[#111111] dark:text-zinc-100 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-xs font-bold"
          >
            Apply
          </button>
        </form>
      )}
    </div>
  );
};

/* --- Interactive Sub-Blocks --- */

const VoicePlayerBlock: React.FC<{ audioDataUrl?: string; duration: number }> = ({
  audioDataUrl,
  duration,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(duration || 0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.playbackRate = speed;
      el.play().catch(() => {});
      setPlaying(true);
    }
  };

  const cycleSpeed = () => {
    const next: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const fmt = (sec: number) => {
    const s = Math.floor(sec || 0);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? Math.min(100, (currentTime / totalTime) * 100) : 0;

  return (
    <div className="p-4 rounded-2xl bg-[#242329] text-white flex items-center gap-4 border border-zinc-700/70">
      {audioDataUrl && (
        <audio
          ref={audioRef}
          src={audioDataUrl}
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (isFinite(d) && d > 0) setTotalTime(d);
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => {
            setPlaying(false);
            setCurrentTime(0);
          }}
        />
      )}

      <button
        type="button"
        disabled={!audioDataUrl}
        onClick={togglePlay}
        aria-label={playing ? 'Pause voice recording' : 'Play voice recording'}
        className="w-12 h-12 rounded-full bg-white text-[#111111] flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
      >
        {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="relative h-5 flex items-center">
          <div className="w-full h-2.5 rounded-full bg-zinc-600/70 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={totalTime || 1}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const t = Number(e.target.value);
              setCurrentTime(t);
              if (audioRef.current) audioRef.current.currentTime = t;
            }}
            aria-label="Audio scrub slider"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <p className="font-mono text-xs text-zinc-300 tabular-nums">
          {fmt(currentTime)} / {fmt(totalTime)}
        </p>
      </div>

      <button
        type="button"
        onClick={cycleSpeed}
        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-zinc-200 hover:bg-zinc-700"
      >
        {speed}×
      </button>
    </div>
  );
};

const DividerBlock: React.FC<{ style: EditorBlock['dividerStyle'] }> = ({ style }) => {
  switch (style) {
    case 'dotted':
      return <hr className="my-3 border-t-4 border-dotted border-zinc-400 dark:border-zinc-600" />;
    case 'dashed':
      return <hr className="my-3 border-t-2 border-dashed border-zinc-400 dark:border-zinc-600" />;
    case 'double':
      return <hr className="my-3 border-t-4 border-double border-zinc-400 dark:border-zinc-600" />;
    case 'ornament':
      return (
        <div className="my-3 flex items-center gap-3 text-zinc-400">
          <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
          <span className="text-base">❧</span>
          <div className="flex-1 h-px bg-zinc-300 dark:bg-zinc-700" />
        </div>
      );
    case 'stars':
      return (
        <div className="my-3 flex items-center justify-center gap-4 text-zinc-400 text-sm tracking-widest">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
      );
    case 'floral':
      return (
        <div className="my-3 flex items-center justify-center gap-3 text-zinc-400 text-sm">
          <span>✿</span>
          <span>·</span>
          <span>✿</span>
          <span>·</span>
          <span>✿</span>
        </div>
      );
    case 'wavy':
      return (
        <div className="my-3 flex justify-center text-zinc-400">
          <svg viewBox="0 0 200 12" className="w-48 h-3" fill="none">
            <path
              d="M0 6 Q 12.5 1, 25 6 T 50 6 T 75 6 T 100 6 T 125 6 T 150 6 T 175 6 T 200 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    default:
      return <hr className="my-3 border-t-2 border-zinc-300 dark:border-zinc-700" />;
  }
};

const TableSheetBlock: React.FC<{
  isSheet: boolean;
  data: string[][];
  onChange: (data: string[][]) => void;
}> = ({ isSheet, data, onChange }) => {
  const updateCell = (r: number, c: number, val: string) => {
    const next = data.map((row, rIdx) =>
      rIdx === r ? row.map((cell, cIdx) => (cIdx === c ? val : cell)) : row
    );
    onChange(next);
  };

  const addRow = () => {
    const cols = data[0]?.length || 3;
    onChange([...data, Array(cols).fill('')]);
  };

  const addCol = () => {
    onChange(data.map((row, idx) => [...row, idx === 0 ? `Col ${row.length + 1}` : '']));
  };

  const colSums = isSheet
    ? (data[0] || []).map((_, cIdx) => {
        let sum = 0;
        let hasNumeric = false;
        for (let r = 1; r < data.length; r++) {
          const num = Number(data[r][cIdx]);
          if (data[r][cIdx] !== '' && !Number.isNaN(num)) {
            sum += num;
            hasNumeric = true;
          }
        }
        return hasNumeric ? sum : null;
      })
    : [];

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {data.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={
                  rIdx === 0
                    ? 'bg-zinc-100 dark:bg-zinc-800 font-bold'
                    : 'border-t border-zinc-200 dark:border-zinc-800'
                }
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 p-0 min-w-[90px]"
                  >
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                      className="w-full px-3 py-2 bg-transparent focus:outline-none focus:bg-emerald-50/40 dark:focus:bg-emerald-950/20"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {isSheet && (
              <tr className="border-t-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 font-mono text-xs font-bold">
                {colSums.map((sum, idx) => (
                  <td key={idx} className="px-3 py-2 text-zinc-600 dark:text-zinc-300 tabular-nums">
                    {sum !== null ? `Σ ${sum}` : idx === 0 ? 'Total' : ''}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500">
        <button type="button" onClick={addRow} className="hover:text-[#111111] dark:hover:text-white flex items-center gap-1">
          <Plus className="w-3 h-3" /> Row
        </button>
        <button type="button" onClick={addCol} className="hover:text-[#111111] dark:hover:text-white flex items-center gap-1">
          <Plus className="w-3 h-3" /> Column
        </button>
      </div>
    </div>
  );
};

const InlineChartBlock: React.FC<{
  title: string;
  data: { label: string; value: number }[];
  onChange: (title: string, data: { label: string; value: number }[]) => void;
}> = ({ title, data, onChange }) => {
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => onChange(e.target.value, data)}
        className="font-bold text-sm bg-transparent focus:outline-none w-full"
      />
      <div className="h-28 flex items-end gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
            <span className="font-mono text-[10px] text-zinc-500 tabular-nums">{item.value}</span>
            <div
              className="w-full max-w-[36px] rounded-t-lg bg-[#84C9A6] border border-[#111111]"
              style={{ height: `${Math.max(10, (item.value / maxVal) * 75)}%` }}
            />
            <span className="text-[11px] font-semibold truncate max-w-full">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1 text-xs">
            <input
              type="text"
              value={item.label}
              onChange={(e) => {
                const next = data.map((d, i) => (i === idx ? { ...d, label: e.target.value } : d));
                onChange(title, next);
              }}
              className="w-12 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent"
            />
            <input
              type="number"
              value={item.value}
              onChange={(e) => {
                const next = data.map((d, i) =>
                  i === idx ? { ...d, value: Number(e.target.value) || 0 } : d
                );
                onChange(title, next);
              }}
              className="w-12 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent font-mono"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange(title, [...data, { label: 'New', value: 5 }])}
          className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800"
        >
          + Bar
        </button>
      </div>
    </div>
  );
};

const StickerBlock: React.FC<{
  stickerId: string;
  onSelect: (id: string) => void;
}> = ({ stickerId, onSelect }) => {
  const [picking, setPicking] = useState(false);

  const renderStickerSvg = (id: string) => {
    switch (id) {
      case 'sprout':
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#D1FAE5" stroke="#111" strokeWidth="2.5" />
            <path d="M32 48V28M32 32C22 32 18 22 28 20C32 22 32 28 32 32ZM32 28C42 28 46 18 36 16C32 18 32 24 32 28Z" fill="#84C9A6" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'heart':
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#FCE7F3" stroke="#111" strokeWidth="2.5" />
            <path d="M32 46S16 36 16 25A8 8 0 0 1 32 22A8 8 0 0 1 48 25C48 36 32 46 32 46Z" fill="#EC4899" stroke="#111" strokeWidth="2.5" />
          </svg>
        );
      case 'moon':
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#EDE9FE" stroke="#111" strokeWidth="2.5" />
            <path d="M38 18A14 14 0 1 0 46 40A11 11 0 1 1 38 18Z" fill="#7C3AED" stroke="#111" strokeWidth="2.5" />
          </svg>
        );
      case 'coffee':
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#FEF3C7" stroke="#111" strokeWidth="2.5" />
            <rect x="20" y="26" width="20" height="18" rx="4" fill="#D97706" stroke="#111" strokeWidth="2.5" />
            <path d="M40 30H45A4 4 0 0 1 45 38H40" fill="none" stroke="#111" strokeWidth="2.5" />
          </svg>
        );
      case 'star':
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#FEF9C3" stroke="#111" strokeWidth="2.5" />
            <path d="M32 14L37 25L49 27L40 35L42 47L32 41L22 47L24 35L15 27L27 25Z" fill="#E8C974" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        );
      case 'cloud':
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#E0F2FE" stroke="#111" strokeWidth="2.5" />
            <path d="M22 40H43A7 7 0 0 0 44 26A10 10 0 0 0 25 24A8 8 0 0 0 22 40Z" fill="#FFFFFF" stroke="#111" strokeWidth="2.5" />
          </svg>
        );
      case 'spark':
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#F3E8FF" stroke="#111" strokeWidth="2.5" />
            <path d="M32 14L36 28L50 32L36 36L32 50L28 36L14 32L28 28Z" fill="#A855F7" stroke="#111" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 64 64" className="w-16 h-16">
            <circle cx="32" cy="32" r="28" fill="#FEF3C7" stroke="#111" strokeWidth="2.5" />
            <circle cx="32" cy="32" r="12" fill="#F59E0B" stroke="#111" strokeWidth="2.5" />
          </svg>
        );
    }
  };

  return (
    <div className="py-1 space-y-2">
      <button
        type="button"
        onClick={() => setPicking((v) => !v)}
        className="inline-flex items-center gap-3 p-1 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {renderStickerSvg(stickerId)}
        <span className="text-xs font-semibold text-zinc-400">Tap to switch sticker</span>
      </button>

      {picking && (
        <div className="flex flex-wrap gap-2 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
          {STICKER_PACK.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSelect(s.id);
                setPicking(false);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const WashiTapeBlock: React.FC<{
  label: string;
  variant: string;
  onChange: (label: string, variant: string) => void;
}> = ({ label, variant, onChange }) => {
  const current = WASHI_VARIANTS.find((w) => w.id === variant) || WASHI_VARIANTS[0];

  return (
    <div className="space-y-1.5 my-1">
      <div
        className={`px-4 py-2 rounded-lg border-y-2 border-dashed flex items-center justify-between gap-2 -rotate-0.5 ${current.bg}`}
      >
        <input
          type="text"
          value={label}
          onChange={(e) => onChange(e.target.value, current.id)}
          placeholder="Washi tape label..."
          className="bg-transparent font-display font-extrabold text-sm tracking-wide focus:outline-none flex-1 min-w-0 placeholder:text-current/50"
        />
        <div className="flex items-center gap-1 shrink-0">
          {WASHI_VARIANTS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onChange(label, w.id)}
              title={w.label}
              className={`w-3.5 h-3.5 rounded-full border border-black/30 ${
                w.id === current.id ? 'ring-2 ring-black/50' : ''
              } ${w.bg}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CountdownBlock: React.FC<{
  title: string;
  date: string;
  onChange: (title: string, date: string) => void;
}> = ({ title, date, onChange }) => {
  const target = new Date(date + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  const badge =
    diffDays === 0 ? 'Today!' : diffDays > 0 ? `${diffDays}d left` : `${Math.abs(diffDays)}d ago`;

  return (
    <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Hourglass className="w-5 h-5 text-zinc-500 shrink-0" />
        <input
          type="text"
          value={title}
          onChange={(e) => onChange(e.target.value, date)}
          className="font-bold text-sm bg-transparent focus:outline-none min-w-0 flex-1"
        />
      </div>
      <div className="flex items-center gap-2.5">
        <input
          type="date"
          value={date}
          onChange={(e) => onChange(title, e.target.value)}
          className="text-xs font-mono bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1"
        />
        <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-[#111111] text-white dark:bg-white dark:text-[#111111] tabular-nums">
          {badge}
        </span>
      </div>
    </div>
  );
};
