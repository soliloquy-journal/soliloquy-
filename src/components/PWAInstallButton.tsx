import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'sidebar' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="px-4 py-3 rounded-xl border-2 border-[#111111]/25 dark:border-zinc-700 bg-zinc-50 dark:bg-[#222228] text-xs font-bold flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Running as an installed offline app on this device.</span>
        </div>
      );
    }
    return null;
  }

  const iosGuideModal = showIOSGuide ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={() => setShowIOSGuide(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tactile-card w-full max-w-sm p-6 space-y-4 text-[#111111] dark:text-zinc-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-[#84C9A6] border-2 border-[#111111] flex items-center justify-center shadow-[2px_2px_0px_#111111]">
              <Smartphone className="w-5 h-5 text-[#111111]" />
            </span>
            <h3 className="text-lg font-extrabold tracking-tight">Install on iPhone / iPad</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowIOSGuide(false)}
            aria-label="Close iOS install instructions"
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ol className="space-y-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <li className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#E8C974] border border-[#111111] text-[#111111] font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
              1
            </span>
            <span className="flex items-center gap-1.5 flex-wrap">
              Tap the <Share className="w-4 h-4 inline shrink-0" /> <strong>Share</strong> button in Safari&apos;s toolbar.
            </span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#84C9A6] border border-[#111111] text-[#111111] font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
              2
            </span>
            <span className="flex items-center gap-1.5 flex-wrap">
              Scroll down and tap <PlusSquare className="w-4 h-4 inline shrink-0" /> <strong>Add to Home Screen</strong>.
            </span>
          </li>
        </ol>

        <button
          type="button"
          onClick={() => setShowIOSGuide(false)}
          className="tactile-btn w-full py-2.5 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-sm"
        >
          Got it
        </button>
      </div>
    </div>
  ) : null;

  if (isInstallable) {
    if (variant === 'sidebar') {
      return (
        <button
          type="button"
          onClick={install}
          className={`tactile-btn w-full py-2.5 px-4 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-xs flex items-center justify-center gap-2 hover:opacity-95 ${className}`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Install Offline App</span>
        </button>
      );
    }

    if (variant === 'card') {
      return (
        <button
          type="button"
          onClick={install}
          className={`tactile-btn w-full py-3 px-4 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 ${className}`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Install App to Home Screen</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`px-3 py-2 rounded-xl border-2 border-[#111111] bg-[#84C9A6] text-[#111111] shadow-[2px_2px_0px_#111111] font-extrabold text-xs flex items-center gap-1.5 hover:opacity-95 whitespace-nowrap ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    if (variant === 'sidebar') {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`w-full py-2 px-3 rounded-xl border-2 border-[#111111] dark:border-zinc-500 text-[#111111] dark:text-zinc-100 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${className}`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Add to Home Screen</span>
          </button>
          {iosGuideModal}
        </>
      );
    }

    if (variant === 'card') {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            className={`w-full py-3 px-4 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-[#FAF5E8] dark:bg-[#222228] font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-95 ${className}`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Install on iPhone / iPad (Safari Guide)</span>
          </button>
          {iosGuideModal}
        </>
      );
    }

    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`px-3 py-2 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-[#222228] text-[#111111] dark:text-zinc-100 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Install</span>
        </button>
        {iosGuideModal}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <div className="p-3.5 rounded-xl border-2 border-dashed border-zinc-400 dark:border-zinc-600 text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-start gap-2.5">
        <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Open this page in Chrome, Edge, or Safari and tap <strong>Add to Home Screen</strong> /{' '}
          <strong>Install app</strong> in your browser menu to use Soliloquy fullscreen offline on your phone.
        </span>
      </div>
    );
  }

  return null;
};
