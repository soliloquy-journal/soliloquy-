import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Download,
  Upload,
  Lock,
  ShieldCheck,
  MessageSquarePlus,
  ListChecks,
  Type,
  AlertTriangle,
  Trash2,
  FileText,
  Share2,
} from 'lucide-react';
import { TAB_THEMES } from '../constants/moods';
import { useJournal } from '../context/JournalContext';
import type { BackupPayload, ThemePreference } from '../types/journal';
import {
  buildBackupPayload,
  downloadJsonFile,
  exportJournalAsReadableText,
  restoreBackupPayload,
  validateBackupPayload,
} from '../utils/backup';
import { toDateKey } from '../utils/dateUtils';
import { GOOGLE_NOTE_FONTS, type GoogleNoteFontOption } from '../utils/noteFonts';
import { shareAppWithFriend } from '../utils/share';
import { FeedbackModal } from './FeedbackModal';
import { PinModal } from './PinModal';
import { PWAInstallButton } from './PWAInstallButton';
import { TactileSelect } from './TactileSelect';

const SETTINGS_THEME = TAB_THEMES.settings;

const THEME_OPTIONS: { value: ThemePreference; label: string; dotColor: string }[] = [
  { value: 'light', label: 'Light', dotColor: '#FAF5E8' },
  { value: 'dark', label: 'Dark', dotColor: '#18181B' },
  { value: 'system', label: 'System', dotColor: '#E5A27A' },
];

const FONT_CATEGORIES: ('All' | GoogleNoteFontOption['category'])[] = [
  'All',
  'Sans',
  'Serif',
  'Handwriting',
  'Mono',
];

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    setTheme,
    noteFont,
    setNoteFont,
    hasPin,
    configurePin,
    clearPin,
    resetAllData,
    dismissBackupReminder,
    setCustomTagsModalOpen,
    setPrivacyModalOpen,
    showToast,
  } = useJournal();

  const [nameDraft, setNameDraft] = useState(settings.userName);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'remove' | null>(null);
  const [pendingBackup, setPendingBackup] = useState<BackupPayload | null>(null);
  const [fontGridOpen, setFontGridOpen] = useState(false);
  const [fontCategory, setFontCategory] = useState<'All' | GoogleNoteFontOption['category']>('All');
  const [resetModalStep, setResetModalStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameDraft(settings.userName);
  }, [settings.userName]);

  const handleNameBlur = async () => {
    if (nameDraft !== settings.userName) {
      await updateSettings({ userName: nameDraft.trim(), hasCompletedNameSetup: true });
    }
  };

  const handleExportBackup = async () => {
    const payload = await buildBackupPayload();
    downloadJsonFile(payload, `journal-backup-${toDateKey(new Date())}.json`);
    dismissBackupReminder();
    showToast('JSON backup exported', 'success');
  };

  const handleExportReadable = async (format: 'md' | 'txt') => {
    await exportJournalAsReadableText(format);
    showToast(`Exported readable .${format} archive`, 'success');
  };

  const handleShareApp = async () => {
    const result = await shareAppWithFriend();
    if (result === 'copied') {
      showToast('Link copied!', 'success');
    } else if (result === 'shared') {
      showToast('Thanks for sharing Soliloquy!', 'success');
    }
  };

  const handleBackupFileSelected = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') throw new Error('Could not read file.');
        const parsed = JSON.parse(reader.result);
        const validated = validateBackupPayload(parsed);
        setPendingBackup(validated);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = async (mode: 'merge' | 'replace') => {
    if (!pendingBackup) return;
    await restoreBackupPayload(pendingBackup, mode);
    setPendingBackup(null);
    showToast(
      mode === 'replace' ? 'Backup restored (replaced local data)' : 'Backup merged with local data',
      'success'
    );
  };

  const handleToggleReminder = async () => {
    const next = !settings.reminderEnabled;
    if (next && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission().catch(() => {});
    }
    await updateSettings({ reminderEnabled: next });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-zinc-100">
          Settings
        </h1>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {settings.lastBackupAt
            ? `Last backup: ${new Date(settings.lastBackupAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'No backup yet'}
        </p>
      </header>

      {/* Soft Apricot Greeting Card matching Settings Taskbar Theme */}
      <section
        className="tactile-card overflow-hidden text-[#111111]"
        style={{ backgroundColor: SETTINGS_THEME.accentHex }}
      >
        <div className="p-5 sm:p-6 space-y-3">
          <h2 className="text-xl font-extrabold tracking-tight text-[#111111]">
            What should we call you?
          </h2>
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl border-2 border-[#111111] bg-white text-[#111111] placeholder:text-zinc-400 font-bold text-base focus:outline-none shadow-[2px_2px_0px_#111111]"
          />
          <p
            className="text-xs sm:text-sm font-semibold leading-relaxed"
            style={{ color: SETTINGS_THEME.subTextOnAccent }}
          >
            Shown on your Soliloquy greeting, and it stays on this device. Leave it empty for a plain hello.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPrivacyModalOpen(true)}
          className="w-full px-5 sm:px-6 py-3.5 border-t-2 border-[#111111]/15 flex items-center justify-between text-sm font-bold text-[#111111] hover:bg-black/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            100% Local &amp; Offline
          </span>
          <span className="flex items-center gap-1 text-xs font-extrabold">
            Privacy details <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </section>

      {/* Preferences */}
      <section className="space-y-2.5">
        <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase px-1">
          Preferences
        </p>
        <div className="tactile-card divide-y divide-zinc-200 dark:divide-zinc-800 text-[#111111] dark:text-zinc-100">
          <div className="px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="font-bold text-base">Theme</span>
            <TactileSelect
              compact
              align="right"
              value={settings.theme}
              options={THEME_OPTIONS}
              onChange={(val) => setTheme(val)}
              ariaLabel="Select color theme"
              className="w-36"
            />
          </div>

          <div className="px-5 py-4 flex items-center justify-between">
            <span className="font-bold text-base">Daily reading</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {settings.dailyReading ? 'On' : 'Off'}
              </span>
              <ToggleSwitch
                checked={settings.dailyReading}
                onChange={(val) => updateSettings({ dailyReading: val })}
                label="Toggle daily reading"
              />
            </div>
          </div>

          <div className="px-5 py-4 flex items-center justify-between last:rounded-b-xl">
            <span className="font-bold text-base">Reduce motion</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {settings.reduceMotion ? 'On' : 'Off'}
              </span>
              <ToggleSwitch
                checked={settings.reduceMotion}
                onChange={(val) => updateSettings({ reduceMotion: val })}
                label="Toggle reduce motion"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Note Typography (25 Google Fonts — Notes Only) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
            Note Typography
          </p>
          <span
            className="px-2 py-0.5 rounded-lg text-[#111111] border border-[#111111] text-[10px] font-extrabold uppercase tracking-wide"
            style={{ backgroundColor: SETTINGS_THEME.accentHex }}
          >
            Notes Only
          </span>
        </div>

        <div className="tactile-card p-5 space-y-4 text-[#111111] dark:text-zinc-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-bold text-base">
                <Type className="w-4 h-4 shrink-0" />
                <span>Note Writing Font</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Applies only to your journal notes and previews. App menus keep their UI font.
              </p>
            </div>

            <TactileSelect
              compact
              align="right"
              value={noteFont}
              options={GOOGLE_NOTE_FONTS.map((f) => ({
                value: f.name,
                label: `${f.name} · ${f.category}`,
              }))}
              onChange={(val) => setNoteFont(val)}
              ariaLabel="Select Google Font for notes"
              className="sm:w-56 shrink-0"
            />
          </div>

          {/* Live Note Preview */}
          <div className="p-4 rounded-xl border-2 border-[#111111] dark:border-zinc-600 bg-[#FAF5E8] dark:bg-[#141418] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
              <span>Live Note Preview</span>
              <span className="font-mono">{noteFont}</span>
            </div>
            <p className="font-note text-lg font-extrabold tracking-tight text-[#111111] dark:text-zinc-100">
              Evening Reflection &amp; Quiet Wins
            </p>
            <p className="font-note text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Took a calm walk after dinner, organized tomorrow&apos;s priorities, and kept things light.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setFontGridOpen((v) => !v)}
              className="text-xs font-extrabold underline underline-offset-4 text-[#111111] dark:text-zinc-200 hover:opacity-80"
            >
              {fontGridOpen ? 'Hide all 25 Google Fonts grid' : 'Browse all 25 Google Fonts in a grid'}
            </button>

            {fontGridOpen && (
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {FONT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFontCategory(cat)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border-2 transition-colors ${
                        fontCategory === cat
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {GOOGLE_NOTE_FONTS.filter(
                    (f) => fontCategory === 'All' || f.category === fontCategory
                  ).map((font) => {
                    const active = noteFont === font.name;
                    return (
                      <button
                        key={font.name}
                        type="button"
                        onClick={() => setNoteFont(font.name)}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          active
                            ? 'bg-[#E5A27A] text-[#111111] border-[#111111] shadow-[2px_2px_0px_#111111]'
                            : 'bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 border-[#111111]/40 dark:border-zinc-600 hover:border-[#111111]'
                        }`}
                      >
                        <p className="font-bold text-xs truncate">{font.name}</p>
                        <p
                          className={`text-[10px] font-semibold ${
                            active ? 'text-[#3B1B09]' : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {font.category}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Reminder */}
      <section className="space-y-2.5">
        <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase px-1">
          Reminder
        </p>
        <div className="tactile-card divide-y divide-zinc-200 dark:divide-zinc-800 text-[#111111] dark:text-zinc-100">
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="font-bold text-base">Remind me</span>
            <ToggleSwitch
              checked={settings.reminderEnabled}
              onChange={handleToggleReminder}
              label="Toggle daily reminder"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="font-bold text-base">Time</span>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => updateSettings({ reminderTime: e.target.value })}
              className="px-3 py-1.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-transparent text-[#111111] dark:text-zinc-100 font-mono font-bold text-sm"
            />
          </div>
        </div>
      </section>

      {/* Security & Custom Tags */}
      <section className="space-y-2.5">
        <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase px-1">
          Privacy &amp; Customization
        </p>
        <div className="tactile-card divide-y divide-zinc-200 dark:divide-zinc-800 text-[#111111] dark:text-zinc-100">
          <button
            type="button"
            onClick={() => setCustomTagsModalOpen(true)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-t-xl"
          >
            <span className="flex items-center gap-3 font-bold text-base">
              <ListChecks className="w-5 h-5" />
              Your own check-in tags
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>

          <div className="px-5 py-4 flex items-center justify-between gap-3 rounded-b-xl">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5" />
              <div>
                <p className="font-bold text-base">Note Lock PIN</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {hasPin ? 'PIN active for locked journal notes' : 'Optional 4–6 digit local PIN'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasPin ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPinModalMode('setup')}
                    className="px-3 py-1.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 text-xs font-bold text-[#111111] dark:text-zinc-100"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setPinModalMode('remove')}
                    className="px-3 py-1.5 rounded-xl border-2 border-red-500 text-red-600 dark:text-red-400 text-xs font-bold"
                  >
                    Disable
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPinModalMode('setup')}
                  className="tactile-btn px-4 py-2 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-xs font-bold"
                >
                  Set PIN
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* JSON Export / Import Backup */}
      <section className="space-y-2.5">
        <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase px-1">
          Local Data Backup
        </p>
        <div className="tactile-card p-5 space-y-4 text-[#111111] dark:text-zinc-100">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Everything—rich notes, folders, check-ins, custom tags, photos, and voice memos—lives inside IndexedDB on your device. Export a JSON backup anytime so you never lose your journal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="tactile-btn py-3 px-4 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-bold text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export JSON Backup
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="tactile-btn py-3 px-4 rounded-xl bg-white dark:bg-[#25252B] text-[#111111] dark:text-zinc-100 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import JSON Backup
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Export as Readable Text
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleExportReadable('md')}
                className="py-2.5 px-4 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-[#FAF5E8] dark:bg-[#22222A] text-[#111111] dark:text-zinc-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90"
              >
                <FileText className="w-4 h-4" />
                Download Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => handleExportReadable('txt')}
                className="py-2.5 px-4 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-[#FAF5E8] dark:bg-[#22222A] text-[#111111] dark:text-zinc-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90"
              >
                <FileText className="w-4 h-4" />
                Download Plain Text (.txt)
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              handleBackupFileSelected(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          <PWAInstallButton variant="card" />
        </div>
      </section>

      {/* Share App & Feedback */}
      <section className="space-y-2.5">
        <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase px-1">
          Share &amp; Feedback
        </p>
        <div className="tactile-card p-5 space-y-4 text-[#111111] dark:text-zinc-100">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base">Share Soliloquy or tell us what you think</h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Sharing only copies the app link — your private notes, photos, and mood check-ins never leave your device.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleShareApp}
              className="tactile-btn flex-1 px-5 py-3 rounded-xl font-extrabold text-sm text-[#111111] inline-flex items-center justify-center gap-2 hover:opacity-95"
              style={{ backgroundColor: SETTINGS_THEME.accentHex }}
            >
              <Share2 className="w-4 h-4 shrink-0" />
              Share App with a Friend
            </button>
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(true)}
              className="tactile-btn flex-1 px-5 py-3 rounded-xl bg-white dark:bg-[#25252B] text-[#111111] dark:text-zinc-100 font-extrabold text-sm inline-flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0" />
              Send Feedback / Report a Bug
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-2.5">
        <p className="text-xs font-extrabold tracking-wider text-red-600 dark:text-red-400 uppercase px-1">
          Danger Zone
        </p>
        <div className="tactile-card p-5 space-y-3 border-[#111111] bg-[#E88B84]/15 dark:bg-[#E88B84]/10 text-[#111111] dark:text-zinc-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E88B84] border-2 border-[#111111] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#111111]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base">Reset / Delete All Data</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Permanently erase all notes, folders, check-ins, tags, photos, voice memos, and preferences stored on this device. Export a JSON backup first if you might ever need them.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('');
              setResetModalStep(1);
            }}
            className="tactile-btn w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E88B84] text-[#111111] font-extrabold text-sm inline-flex items-center justify-center gap-2 hover:opacity-95"
          >
            <Trash2 className="w-4 h-4" />
            Reset / Delete All Data
          </button>
        </div>
      </section>

      {/* PIN Modal */}
      <PinModal
        isOpen={pinModalMode !== null}
        mode={pinModalMode || 'setup'}
        onClose={() => setPinModalMode(null)}
        onSubmit={async (pin) => {
          if (pinModalMode === 'setup') {
            await configurePin(pin);
            return true;
          }
          if (pinModalMode === 'remove') {
            return clearPin(pin);
          }
          return false;
        }}
      />

      {/* Restore Backup Merge / Replace Dialog */}
      {pendingBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="tactile-card w-full max-w-md p-6 space-y-4 text-[#111111] dark:text-zinc-100">
            <h3 className="text-xl font-extrabold">Restore Backup</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Found <strong className="text-[#111111] dark:text-white">{pendingBackup.notes.length}</strong> notes,{' '}
              <strong className="text-[#111111] dark:text-white">{pendingBackup.folders.length}</strong> folders, and{' '}
              <strong className="text-[#111111] dark:text-white">{pendingBackup.checkIns.length}</strong> check-ins.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => confirmRestore('merge')}
                className="tactile-btn w-full py-3 rounded-xl bg-[#84C9A6] text-[#111111] font-bold text-sm"
              >
                Merge with existing journal
              </button>
              <button
                type="button"
                onClick={() => confirmRestore('replace')}
                className="w-full py-3 rounded-xl border-2 border-red-500 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Replace all local data
              </button>
              <button
                type="button"
                onClick={() => setPendingBackup(null)}
                className="w-full py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Step Safe Delete All Data Confirmation Modal */}
      {resetModalStep !== 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
          onClick={() => {
            if (!isResetting) setResetModalStep(0);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="tactile-card w-full max-w-md p-6 space-y-4 text-[#111111] dark:text-zinc-100"
          >
            {resetModalStep === 1 ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#E88B84] border-2 border-[#111111] flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-[#111111]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Step 1 of 2
                    </p>
                    <h3 className="text-xl font-extrabold tracking-tight">
                      Export a backup first?
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Resetting clears your entire IndexedDB journal (all notes, folders, check-ins, custom tags, photos, and voice memos) plus local browser preferences. Because everything lives strictly on your device, deleted data cannot be recovered without a JSON backup.
                </p>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export JSON Backup First
                </button>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setResetModalStep(0)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setResetModalStep(2);
                    }}
                    className="tactile-btn flex-1 py-2.5 rounded-xl bg-[#E88B84] text-[#111111] font-extrabold text-sm"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (deleteConfirmText.trim() !== 'DELETE' || isResetting) return;
                  setIsResetting(true);
                  try {
                    await resetAllData();
                    setResetModalStep(0);
                    setDeleteConfirmText('');
                  } finally {
                    setIsResetting(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                    Step 2 of 2 · Final Confirmation
                  </p>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    Confirm permanent wipe
                  </h3>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Type <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono font-extrabold text-[#111111] dark:text-white">DELETE</code> below to clear all local journal data.
                </p>

                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-transparent font-mono font-bold text-sm focus:outline-none"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={() => setResetModalStep(1)}
                    className="flex-1 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-bold text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={deleteConfirmText.trim() !== 'DELETE' || isResetting}
                    className="tactile-btn flex-1 py-2.5 rounded-xl bg-[#E88B84] text-[#111111] font-extrabold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isResetting ? 'Clearing...' : 'Permanently Delete'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </div>
  );
};

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`w-14 h-8 rounded-full border-2 border-[#111111] dark:border-zinc-200 p-0.5 transition-colors flex items-center ${
      checked ? 'bg-[#18181B] dark:bg-zinc-200 justify-end' : 'bg-white dark:bg-zinc-800 justify-start'
    }`}
  >
    <span
      className={`w-6 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#E5A27A] border border-[#111111]' : 'bg-[#18181B] dark:bg-zinc-300'
      }`}
    />
  </button>
);
