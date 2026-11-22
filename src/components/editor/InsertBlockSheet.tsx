import React, { useState } from 'react';
import {
  Search,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  CheckSquare,
  List,
  ListOrdered,
  ListCollapse,
  Info,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  OctagonAlert,
  Pencil,
  StickyNote,
  MessageSquareQuote,
  KeyRound,
  Table,
  Sheet,
  BarChart3,
  Image as ImageIcon,
  Mic,
  Minus,
  Smile,
  Hourglass,
  Calendar,
  Star,
  ChevronDownSquare,
  Hash,
  Clock,
  CalendarCheck,
  Sticker,
  Sparkles,
  X,
} from 'lucide-react';
import type { CalloutVariant, DividerStyle, EditorBlockType } from '../../types/journal';

export interface InsertSelection {
  kind: 'block' | 'quick-link' | 'quick-tag' | 'quick-date' | 'quick-time';
  blockType?: EditorBlockType;
  calloutVariant?: CalloutVariant;
  dividerStyle?: DividerStyle;
}

interface InsertItem {
  id: string;
  label: string;
  section: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  selection: InsertSelection;
}

const INSERT_ITEMS: InsertItem[] = [
  // Write
  { id: 'p', label: 'Normal text', section: 'Write', Icon: Type, selection: { kind: 'block', blockType: 'paragraph' } },
  { id: 'h1', label: 'Heading 1', section: 'Write', Icon: Heading1, selection: { kind: 'block', blockType: 'h1' } },
  { id: 'h2', label: 'Heading 2', section: 'Write', Icon: Heading2, selection: { kind: 'block', blockType: 'h2' } },
  { id: 'h3', label: 'Heading 3', section: 'Write', Icon: Heading3, selection: { kind: 'block', blockType: 'h3' } },
  { id: 'quote', label: 'Quote', section: 'Write', Icon: Quote, selection: { kind: 'block', blockType: 'quote' } },
  { id: 'pullquote', label: 'Pull quote', section: 'Write', Icon: MessageSquareQuote, selection: { kind: 'block', blockType: 'pullquote' } },
  { id: 'code', label: 'Code block', section: 'Write', Icon: Code2, selection: { kind: 'block', blockType: 'code' } },

  // Lists
  { id: 'checklist', label: 'Checklist', section: 'Lists', Icon: CheckSquare, selection: { kind: 'block', blockType: 'checklist' } },
  { id: 'bullet', label: 'Bulleted list', section: 'Lists', Icon: List, selection: { kind: 'block', blockType: 'bullet' } },
  { id: 'numbered', label: 'Numbered list', section: 'Lists', Icon: ListOrdered, selection: { kind: 'block', blockType: 'numbered' } },
  { id: 'toggle', label: 'Toggle', section: 'Lists', Icon: ListCollapse, selection: { kind: 'block', blockType: 'toggle' } },

  // Boxes and cards
  { id: 'info', label: 'Info', section: 'Boxes and cards', Icon: Info, iconColor: 'text-blue-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'info' } },
  { id: 'tip', label: 'Tip', section: 'Boxes and cards', Icon: Lightbulb, iconColor: 'text-emerald-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'tip' } },
  { id: 'success', label: 'Success', section: 'Boxes and cards', Icon: CheckCircle2, iconColor: 'text-green-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'success' } },
  { id: 'warning', label: 'Warning', section: 'Boxes and cards', Icon: AlertTriangle, iconColor: 'text-amber-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'warning' } },
  { id: 'danger', label: 'Danger', section: 'Boxes and cards', Icon: OctagonAlert, iconColor: 'text-red-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'danger' } },
  { id: 'note', label: 'Note', section: 'Boxes and cards', Icon: Pencil, iconColor: 'text-purple-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'note' } },
  { id: 'sticky', label: 'Sticky note', section: 'Boxes and cards', Icon: StickyNote, iconColor: 'text-yellow-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'sticky' } },
  { id: 'quotecard', label: 'Quote card', section: 'Boxes and cards', Icon: MessageSquareQuote, iconColor: 'text-violet-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'quotecard' } },
  { id: 'keyidea', label: 'Key idea', section: 'Boxes and cards', Icon: KeyRound, iconColor: 'text-sky-600', selection: { kind: 'block', blockType: 'callout', calloutVariant: 'keyidea' } },

  // Tables and media
  { id: 'table', label: 'Table', section: 'Tables and media', Icon: Table, selection: { kind: 'block', blockType: 'table' } },
  { id: 'sheet', label: 'Sheet', section: 'Tables and media', Icon: Sheet, selection: { kind: 'block', blockType: 'sheet' } },
  { id: 'chart', label: 'Chart', section: 'Tables and media', Icon: BarChart3, selection: { kind: 'block', blockType: 'chart' } },
  { id: 'photo', label: 'Add a photo', section: 'Tables and media', Icon: ImageIcon, selection: { kind: 'block', blockType: 'photo' } },
  { id: 'voice', label: 'Voice', section: 'Tables and media', Icon: Mic, selection: { kind: 'block', blockType: 'voice' } },
  { id: 'line-default', label: 'Line', section: 'Tables and media', Icon: Minus, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'thick' } },

  // Lines
  { id: 'thick', label: 'Thick', section: 'Lines', Icon: Minus, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'thick' } },
  { id: 'dotted', label: 'Dotted', section: 'Lines', Icon: Minus, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'dotted' } },
  { id: 'double', label: 'Double', section: 'Lines', Icon: Minus, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'double' } },
  { id: 'ornament', label: 'Ornament', section: 'Lines', Icon: Sparkles, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'ornament' } },
  { id: 'wavy', label: 'Wavy', section: 'Lines', Icon: Minus, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'wavy' } },
  { id: 'stars', label: 'Stars', section: 'Lines', Icon: Star, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'stars' } },
  { id: 'floral', label: 'Floral', section: 'Lines', Icon: Sparkles, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'floral' } },
  { id: 'dashed', label: 'Dashed', section: 'Lines', Icon: Minus, selection: { kind: 'block', blockType: 'divider', dividerStyle: 'dashed' } },

  // Elements
  { id: 'sticker', label: 'Sticker', section: 'Elements', Icon: Sticker, selection: { kind: 'block', blockType: 'sticker' } },
  { id: 'washi', label: 'Washi tape', section: 'Elements', Icon: StickyNote, selection: { kind: 'block', blockType: 'washi' } },
  { id: 'countdown', label: 'Countdown', section: 'Elements', Icon: Hourglass, selection: { kind: 'block', blockType: 'countdown' } },
  { id: 'date', label: 'Date', section: 'Elements', Icon: Calendar, selection: { kind: 'block', blockType: 'date' } },
  { id: 'mood', label: 'Mood', section: 'Elements', Icon: Smile, selection: { kind: 'block', blockType: 'mood' } },
  { id: 'rating', label: 'Rating', section: 'Elements', Icon: Star, selection: { kind: 'block', blockType: 'rating' } },
  { id: 'dropdown', label: 'Dropdown', section: 'Elements', Icon: ChevronDownSquare, selection: { kind: 'block', blockType: 'dropdown' } },

  // Quick add
  { id: 'linknote', label: 'Link to a note', section: 'Quick add', Icon: () => <span className="font-mono font-extrabold text-sm">[[ ]]</span>, selection: { kind: 'quick-link' } },
  { id: 'addtag', label: 'Add a tag', section: 'Quick add', Icon: Hash, selection: { kind: 'quick-tag' } },
  { id: 'todaydate', label: "Today's date", section: 'Quick add', Icon: CalendarCheck, selection: { kind: 'quick-date' } },
  { id: 'timenow', label: 'Time now', section: 'Quick add', Icon: Clock, selection: { kind: 'quick-time' } },
];

const SECTIONS = ['Write', 'Lists', 'Boxes and cards', 'Tables and media', 'Lines', 'Elements', 'Quick add'];

export const InsertBlockSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: InsertSelection) => void;
}> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? INSERT_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) || item.section.toLowerCase().includes(q)
      )
    : INSERT_ITEMS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[85vh] bg-white dark:bg-[#161D24] text-[#191C1A] dark:text-[#F1F5F9] rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#E5E0D4] dark:border-[#26313E] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle & Header */}
        <div className="pt-3 px-5 pb-3 space-y-3 border-b border-[#E5E0D4] dark:border-[#26313E]">
          <div className="w-10 h-1.5 rounded-full bg-[#E5E0D4] dark:bg-[#26313E] mx-auto sm:hidden" />
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">Insert</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close insert sheet"
              className="w-9 h-9 rounded-xl hover:bg-[#FAF8F3] dark:hover:bg-[#1D2630] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#5C645E] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blocks"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E0D4] dark:border-[#26313E] bg-[#FAF8F3] dark:bg-[#0E1318] text-sm font-medium focus:outline-none focus:border-[#1E4D3B] dark:focus:border-[#6EE7B7]"
            />
          </div>
        </div>

        {/* Grid Body */}
        <div className="overflow-y-auto p-5 space-y-6">
          {filtered.length === 0 ? (
            <p className="text-sm text-[#5C645E] dark:text-[#94A3B8] text-center py-6">
              No matching blocks.
            </p>
          ) : (
            SECTIONS.map((sec) => {
              const items = filtered.filter((i) => i.section === sec);
              if (items.length === 0) return null;
              return (
                <div key={sec} className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#5C645E] dark:text-[#94A3B8]">
                    {sec}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {items.map((item) => {
                      const Icon = item.Icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            onSelect(item.selection);
                            setQuery('');
                            onClose();
                          }}
                          className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-[#FAF8F3] dark:hover:bg-[#1D2630] transition-colors cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#FAF8F3] dark:bg-[#0E1318] border border-[#E5E0D4] dark:border-[#26313E] flex items-center justify-center">
                            <Icon className={`w-5 h-5 ${item.iconColor || ''}`} />
                          </div>
                          <span className="text-xs font-semibold text-center leading-tight">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
