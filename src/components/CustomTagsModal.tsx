import React, { useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useJournal } from '../context/JournalContext';

export const CustomTagsModal: React.FC = () => {
  const { customTagsModalOpen, setCustomTagsModalOpen, customTags, addCustomTag, removeCustomTag } =
    useJournal();
  const [input, setInput] = useState('');

  if (!customTagsModalOpen) return null;

  const activeTags = customTags.filter((t) => !t.archived);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await addCustomTag(input, 'Yours');
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF5E8] dark:bg-[#121215] overflow-y-auto p-4 sm:p-8">
      <div className="max-w-lg mx-auto pt-2">
        <button
          type="button"
          onClick={() => setCustomTagsModalOpen(false)}
          aria-label="Back"
          className="tactile-btn w-11 h-11 rounded-xl bg-white dark:bg-[#1B1B20] flex items-center justify-center mb-5"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h1 className="text-3xl font-extrabold tracking-tight mb-5">Your own items</h1>

        <div className="tactile-card p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Your tags</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              They show up in the list when you check in
            </p>
          </div>

          {activeTags.length === 0 ? (
            <p className="text-sm font-semibold text-zinc-500 py-1">None yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 py-1">
              {activeTags.map((tag) => (
                <div
                  key={tag.id}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 border-[#111111] dark:border-zinc-400 bg-zinc-50 dark:bg-zinc-900 text-sm font-semibold shadow-[2px_2px_0px_#111111]"
                >
                  <span>{tag.label}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomTag(tag.id)}
                    aria-label={`Remove ${tag.label}`}
                    className="text-zinc-500 hover:text-red-600 dark:hover:text-red-400 p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAdd} className="flex items-center gap-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g. Piano, Traffic, Miss..."
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-zinc-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2D7554]"
            />
            <button
              type="submit"
              className="tactile-btn px-5 py-3 rounded-xl bg-[#18181B] text-white dark:bg-white dark:text-[#111111] font-bold text-sm shrink-0"
            >
              Add
            </button>
          </form>

          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
            A tag you remove stays on past check-ins; it only leaves the list.
          </p>
        </div>
      </div>
    </div>
  );
};
