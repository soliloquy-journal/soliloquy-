import React, { useEffect, useState } from 'react';
import { Smartphone, HardDriveDownload, WifiOff, ShieldCheck, BookOpen } from 'lucide-react';
import { useJournal } from '../context/JournalContext';

export const PrivacyIntroModal: React.FC = () => {
  const { privacyModalOpen, setPrivacyModalOpen, settings, updateSettings } = useJournal();
  const [nameInput, setNameInput] = useState(settings.userName);

  useEffect(() => {
    if (privacyModalOpen) {
      setNameInput(settings.userName);
    }
  }, [privacyModalOpen, settings.userName]);

  if (!privacyModalOpen) return null;

  const isFirstNamePrompt = !settings.hasCompletedNameSetup;

  const handleSaveAndContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await updateSettings({
      userName: nameInput.trim(),
      hasSeenPrivacyIntro: true,
      hasCompletedNameSetup: true,
    });
    setPrivacyModalOpen(false);
  };

  const handleSkipName = async () => {
    await updateSettings({
      hasSeenPrivacyIntro: true,
      hasCompletedNameSetup: true,
    });
    setPrivacyModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <form onSubmit={handleSaveAndContinue} className="w-full max-w-md my-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">yours.</h2>
          <span className="px-3 py-1 rounded-xl bg-[#E8C974] text-[#111111] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] text-xs font-extrabold">
            Soliloquy
          </span>
        </div>

        {isFirstNamePrompt && (
          <div className="tactile-card p-5 space-y-3 bg-[#84C9A6] text-[#111111] border-[#111111]">
            <div className="space-y-0.5">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#0A2E1E]">
                Welcome
              </p>
              <label htmlFor="first-launch-name" className="block text-xl font-extrabold tracking-tight text-[#111111]">
                What should we call you?
              </label>
            </div>
            <input
              id="first-launch-name"
              type="text"
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name (optional)"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#111111] bg-white text-[#111111] placeholder:text-zinc-400 font-bold text-base focus:outline-none shadow-[3px_3px_0px_#111111]"
            />
            <p className="text-xs font-semibold text-[#0A2E1E] leading-relaxed">
              Asked once and stored privately on this device. You can always change it later in Settings.
            </p>
          </div>
        )}

        <div className="tactile-card p-6 space-y-4 bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100 border-[#111111] dark:border-zinc-200">
          <div className="flex items-start gap-4">
            <Smartphone className="w-5 h-5 shrink-0 mt-0.5 text-[#111111] dark:text-zinc-200" />
            <p className="text-sm font-medium leading-relaxed text-[#18181B] dark:text-zinc-100">
              Your journal stays on this device inside local IndexedDB storage. Nothing you write is ever sent anywhere.
            </p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3.5 flex items-start gap-4">
            <WifiOff className="w-5 h-5 shrink-0 mt-0.5 text-[#111111] dark:text-zinc-200" />
            <p className="text-sm font-medium leading-relaxed text-[#18181B] dark:text-zinc-100">
              100% offline-capable: zero internet requests, zero tracking, zero ads, and zero external tools or AI services.
            </p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3.5 flex items-start gap-4">
            <HardDriveDownload className="w-5 h-5 shrink-0 mt-0.5 text-[#111111] dark:text-zinc-200" />
            <p className="text-sm font-medium leading-relaxed text-[#18181B] dark:text-zinc-100">
              Rich block notes, folders, photos, voice recordings, and check-ins can be exported anytime as a single portable JSON backup file in Settings.
            </p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3.5 flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#111111] dark:text-zinc-200" />
            <p className="text-sm font-medium leading-relaxed text-[#18181B] dark:text-zinc-100">
              Optional local PIN protection locks sensitive journal entries with browser-native SHA-256 hashing.
            </p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3.5 flex items-start gap-4">
            <BookOpen className="w-5 h-5 shrink-0 mt-0.5 text-[#111111] dark:text-zinc-200" />
            <p className="text-sm font-medium leading-relaxed text-[#18181B] dark:text-zinc-100">
              Soliloquy is a private personal notebook and reflection space, not a medical or health service.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isFirstNamePrompt && (
            <button
              type="button"
              onClick={handleSkipName}
              className="tactile-btn px-5 py-3.5 rounded-xl bg-white text-[#111111] font-extrabold text-sm hover:bg-zinc-50 shrink-0"
            >
              Skip
            </button>
          )}
          <button
            type="submit"
            className="tactile-btn flex-1 py-3.5 rounded-xl bg-[#E8C974] text-[#111111] font-extrabold text-base hover:opacity-95"
          >
            {isFirstNamePrompt ? 'Save & Continue' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};
