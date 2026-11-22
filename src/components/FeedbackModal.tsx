import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Loader2,
  MessageSquarePlus,
  Send,
  WifiOff,
  X,
} from 'lucide-react';
import { TAB_THEMES } from '../constants/moods';
import { TactileSelect } from './TactileSelect';

export type FeedbackCategory = 'Bug Report' | 'Feature Idea' | 'General Feedback';

const CATEGORY_OPTIONS: { value: FeedbackCategory; label: string; dotColor: string }[] = [
  { value: 'Bug Report', label: 'Bug Report', dotColor: '#E88B84' },
  { value: 'Feature Idea', label: 'Feature Idea', dotColor: '#E8C974' },
  { value: 'General Feedback', label: 'General Feedback', dotColor: '#84C9A6' },
];

const WEB3FORMS_ACCESS_KEY = '1051e7c5-ffdd-4586-857a-f3f2ddf745c5';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState<FeedbackCategory>('Bug Report');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const syncOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCategory('Bug Report');
    setMessage('');
    setEmail('');
    setStatus('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    if (status === 'submitting') return;
    if (status === 'success') {
      resetForm();
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!navigator.onLine) {
      setIsOnline(false);
      setStatus('error');
      setErrorMessage(
        'You appear to be offline right now. Connect to the internet to send your feedback.'
      );
      return;
    }

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      setStatus('error');
      setErrorMessage('Please enter your message before sending.');
      return;
    }

    setStatus('submitting');

    const payload: Record<string, string> = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `Soliloquy - ${category}`,
      from_name: 'Soliloquy User',
      category,
      message: trimmedMsg,
      device_info: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      screen_size:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    };

    if (email.trim()) {
      payload.email = email.trim();
    }

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(
          data?.message || 'Could not send feedback right now. Please try again in a moment.'
        );
      }
    } catch {
      setStatus('error');
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsOnline(false);
        setErrorMessage(
          'Your connection dropped while sending. Reconnect to the internet and try again.'
        );
      } else {
        setErrorMessage('Network error while sending feedback. Please try again.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="tactile-card w-full max-w-md p-5 sm:p-6 space-y-4 text-[#111111] dark:text-zinc-100 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-10 h-10 rounded-xl border-2 border-[#111111] flex items-center justify-center shadow-[2px_2px_0px_#111111] shrink-0"
              style={{ backgroundColor: TAB_THEMES.settings.accentHex }}
            >
              <MessageSquarePlus className="w-5 h-5 text-[#111111]" />
            </span>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">
                Send Feedback
              </h3>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Report a bug or share an idea for Soliloquy
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={status === 'submitting'}
            onClick={handleClose}
            aria-label="Close feedback dialog"
            className="w-8 h-8 rounded-xl border-2 border-[#111111] dark:border-zinc-500 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="py-4 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#84C9A6] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex items-center justify-center">
              <Check className="w-7 h-7 text-[#111111] stroke-[3]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-2xl font-extrabold tracking-tight">Thanks! Feedback received</h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Your <strong>{category}</strong> was sent. Your personal journal notes remain 100% private on your device.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Send another
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="tactile-btn flex-1 py-2.5 rounded-xl bg-[#84C9A6] text-[#111111] font-extrabold text-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isOnline && (
              <div className="p-3.5 rounded-xl border-2 border-[#111111] bg-[#E8C974] text-[#111111] shadow-[2px_2px_0px_#111111] flex items-start gap-2.5">
                <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">
                  You&apos;re currently offline. Everything in Soliloquy works offline, and you can send feedback once you reconnect to the internet.
                </p>
              </div>
            )}

            {status === 'error' && errorMessage && (
              <div className="p-3 rounded-xl border-2 border-[#111111] bg-[#E88B84]/35 text-[#111111] dark:text-zinc-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-700 dark:text-red-300" />
                <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Category
              </label>
              <TactileSelect
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={(val) => setCategory(val)}
                ariaLabel="Select feedback category"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="feedback-message"
                className="block text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="feedback-message"
                required
                rows={4}
                disabled={status === 'submitting'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === 'Bug Report'
                    ? 'What happened, and what did you expect to happen?'
                    : category === 'Feature Idea'
                    ? 'Describe the feature or improvement you would love to see...'
                    : 'Share anything on your mind about Soliloquy...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-[#16161B] text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E5A27A] disabled:opacity-60 resize-y"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="feedback-email"
                className="block text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                Reply Email <span className="font-semibold normal-case text-zinc-400">(optional)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                disabled={status === 'submitting'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-[#16161B] text-[#111111] dark:text-zinc-100 placeholder:text-zinc-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E5A27A] disabled:opacity-60"
              />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                disabled={status === 'submitting'}
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === 'submitting' || !isOnline}
                className="tactile-btn flex-1 py-2.5 px-4 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
