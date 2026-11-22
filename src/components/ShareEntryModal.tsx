import React, { useEffect, useState } from 'react';
import { Download, FileText, Share2, ShieldCheck, X } from 'lucide-react';
import { useJournal } from '../context/JournalContext';
import type { JournalNote, MoodMeta } from '../types/journal';
import {
  downloadEntryImageCard,
  renderEntryToCanvas,
  shareEntryAsText,
} from '../utils/share';

interface ShareEntryModalProps {
  note: JournalNote | null;
  mood: MoodMeta | null;
  onClose: () => void;
}

export const ShareEntryModal: React.FC<ShareEntryModalProps> = ({
  note,
  mood,
  onClose,
}) => {
  const { noteFont, showToast } = useJournal();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    if (!note) {
      setPreviewUrl(null);
      return;
    }

    setIsGenerating(true);
    renderEntryToCanvas(note, mood, { noteFontFamily: noteFont })
      .then((canvas) => {
        if (!active) return;
        setPreviewUrl(canvas.toDataURL('image/png'));
      })
      .catch(() => {
        if (active) setPreviewUrl(null);
      })
      .finally(() => {
        if (active) setIsGenerating(false);
      });

    return () => {
      active = false;
    };
  }, [note, mood, noteFont]);

  if (!note) return null;

  const handleShareText = async () => {
    const result = await shareEntryAsText(note, mood);
    if (result === 'copied') {
      showToast('Formatted entry copied!', 'success');
    } else if (result === 'shared') {
      showToast('Entry shared', 'success');
    }
    if (result !== 'cancelled') {
      onClose();
    }
  };

  const handleSaveCard = async () => {
    try {
      await downloadEntryImageCard(note, mood, { noteFontFamily: noteFont });
      showToast('Neo-Brutalist image card saved!', 'success');
      onClose();
    } catch {
      showToast('Could not save image card', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tactile-card w-full max-w-md p-5 sm:p-6 space-y-4 text-[#111111] dark:text-zinc-100 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Entry
            </h3>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Share only this single entry — rendered 100% offline on your device.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-8 h-8 rounded-xl border-2 border-[#111111] dark:border-zinc-500 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Square Card Preview */}
        <div className="rounded-xl border-2 border-[#111111] dark:border-zinc-400 bg-[#FAF5E8] overflow-hidden shadow-[3px_3px_0px_#111111] aspect-square w-full max-w-[300px] mx-auto flex items-center justify-center">
          {isGenerating || !previewUrl ? (
            <div className="text-xs font-bold text-zinc-500 px-4 text-center">
              Rendering card preview...
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Preview of shareable Neo-Brutalist journal card"
              className="w-full h-full object-contain block"
            />
          )}
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleShareText}
            className="tactile-btn w-full py-3 px-4 rounded-xl bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <FileText className="w-4 h-4" />
            Share as Formatted Text
          </button>

          <button
            type="button"
            onClick={handleSaveCard}
            className="tactile-btn w-full py-3 px-4 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95"
          >
            <Download className="w-4 h-4" />
            Save as Neo-Brutalist Image Card
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>No servers or external APIs — only this entry is exported.</span>
        </div>
      </div>
    </div>
  );
};
