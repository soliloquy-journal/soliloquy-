import React from 'react';
import { motion } from 'motion/react';
import { Sun, TrendingUp, GitFork, BookOpen, SlidersHorizontal, Sparkles, PenLine, Download, X } from 'lucide-react';
import { TAB_THEMES } from '../constants/moods';
import { useJournal } from '../context/JournalContext';
import type { MainTab } from '../types/journal';
import { PWAInstallButton } from './PWAInstallButton';

const NAV_ITEMS: {
  id: MainTab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'journal', label: 'Journal', Icon: BookOpen },
  { id: 'today', label: 'Today', Icon: Sun },
  { id: 'stats', label: 'Stats', Icon: TrendingUp },
  { id: 'patterns', label: 'Patterns', Icon: GitFork },
  { id: 'settings', label: 'Settings', Icon: SlidersHorizontal },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    openNewCheckIn,
    openDraftNote,
    settings,
    toasts,
    backupMilestoneToPrompt,
    dismissBackupReminder,
    exportQuickBackup,
  } = useJournal();
  const reduceMotion = !!settings.reduceMotion;
  const activeTheme = TAB_THEMES[activeTab];

  const handleQuickNewNote = () => {
    openDraftNote();
  };

  const rootStyle = {
    '--tab-bg-light': activeTheme.pageBgLight,
    '--tab-bg-dark': activeTheme.pageBgDark,
    '--tab-accent': activeTheme.accentHex,
  } as React.CSSProperties;

  return (
    <div
      style={rootStyle}
      className="min-h-screen themed-canvas text-[#111111] dark:text-zinc-100 flex flex-col lg:flex-row"
    >
      {/* Desktop Left Navigation Rail */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen border-r-2 border-[#111111] dark:border-zinc-800 bg-white dark:bg-[#18181D] p-5 justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2 pt-1">
            <span
              style={{ backgroundColor: activeTheme.accentHex }}
              className="w-9 h-9 rounded-xl border-2 border-[#111111] flex items-center justify-center shadow-[3px_3px_0px_#111111] transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#111111]" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-[#111111] dark:text-white">
              Soliloquy
            </span>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleQuickNewNote}
              className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <PenLine className="w-4 h-4" />
              New Journal Note
            </button>
            <button
              type="button"
              onClick={() => openNewCheckIn()}
              className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#FFFDF7] dark:bg-[#232329] text-[#111111] dark:text-zinc-100 font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              Mood Check-in
            </button>
          </div>

          <nav className="space-y-1.5" aria-label="Primary navigation">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              const accentHex = TAB_THEMES[id].accentHex;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  style={active ? { backgroundColor: accentHex } : undefined}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    active
                      ? 'text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000]'
                      : 'border-2 border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{label}</span>
                  </span>
                  {active && (
                    <span className="w-2 h-2 rounded-full bg-[#111111] shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <PWAInstallButton variant="sidebar" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 px-2">
            100% offline · stored privately on this device.
          </p>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 min-w-0 pb-[calc(9rem+env(safe-area-inset-bottom,0px))] lg:pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 space-y-5">
          {backupMilestoneToPrompt !== null && (
            <div className="tactile-card-sm px-4 py-3 bg-[#E8C974] text-[#111111] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs sm:text-sm font-extrabold">
                  {backupMilestoneToPrompt}+ local entries saved on this device
                </p>
                <p className="text-[11px] sm:text-xs font-semibold text-[#332605]">
                  Export a JSON backup periodically so you never lose your journal data.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={exportQuickBackup}
                  className="px-3 py-1.5 rounded-xl bg-[#111111] text-white border-2 border-[#111111] text-xs font-extrabold flex items-center gap-1.5 hover:opacity-90"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON
                </button>
                <button
                  type="button"
                  onClick={dismissBackupReminder}
                  aria-label="Dismiss backup reminder"
                  className="w-8 h-8 rounded-xl bg-white/80 hover:bg-white border-2 border-[#111111] flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {children}
        </div>
      </main>

      {/* Pop-Out Neo-Brutalist Bottom Taskbar (Mobile / Tablet) */}
      <nav
        aria-label="Mobile navigation"
        style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        className="lg:hidden fixed left-3 right-3 z-40 pointer-events-none"
      >
        <div className="pointer-events-auto max-w-md mx-auto relative overflow-visible bg-[#18181E] dark:bg-[#222229] text-white border-2 border-[#111111] dark:border-zinc-200 rounded-2xl shadow-[4px_4px_0px_#111111] dark:shadow-[4px_4px_0px_#000000] grid grid-cols-5 items-center h-[64px] px-1.5">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            const accentHex = TAB_THEMES[id].accentHex;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className="relative h-full flex flex-col items-center justify-center focus:outline-none group cursor-pointer"
              >
                {active ? (
                  <div className="flex flex-col items-center justify-center">
                    <motion.div
                      layoutId={reduceMotion ? undefined : 'mobile-nav-popout-orb'}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 460, damping: 30 }
                      }
                      style={{ backgroundColor: accentHex }}
                      className="-mt-8 w-12 h-12 rounded-full border-2 border-[#111111] ring-[5px] themed-halo shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000] flex items-center justify-center text-[#111111]"
                    >
                      <Icon className="w-5 h-5 stroke-[2.4]" />
                    </motion.div>

                    <motion.span
                      layoutId={reduceMotion ? undefined : 'mobile-nav-active-dot'}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 460, damping: 30 }
                      }
                      style={{ backgroundColor: accentHex }}
                      className="mt-2 w-4 h-1.5 rounded-full border border-[#111111]"
                    />
                  </div>
                ) : (
                  <div className="-translate-y-0.5 flex flex-col items-center justify-center gap-1 px-1.5 py-1 rounded-xl transition-transform group-active:scale-95">
                    <Icon className="w-[19px] h-[19px] text-zinc-300 group-hover:text-white transition-colors shrink-0" />
                    <span className="text-[11px] font-semibold tracking-tight leading-none text-zinc-300 group-hover:text-white transition-colors">
                      {label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto tactile-card-sm px-4 py-3 text-sm font-semibold flex items-center justify-between bg-[#18181B] text-white dark:bg-white dark:text-[#111111] border-[#111111] dark:border-zinc-200"
            >
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
