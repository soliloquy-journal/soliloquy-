import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  mode: 'setup' | 'verify' | 'remove';
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: (pin: string) => Promise<boolean>;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  mode,
  title,
  subtitle,
  onClose,
  onSubmit,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setPin('');
    setConfirmPin('');
    setStep('enter');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const current = step === 'enter' ? pin : confirmPin;
    if (current.length < 4 || current.length > 6 || !/^\d+$/.test(current)) {
      setError('Enter a 4 to 6 digit numeric PIN.');
      return;
    }

    if (mode === 'setup' && step === 'enter') {
      setStep('confirm');
      return;
    }

    if (mode === 'setup' && step === 'confirm') {
      if (pin !== confirmPin) {
        setError('PINs do not match. Try again.');
        setConfirmPin('');
        return;
      }
    }

    setBusy(true);
    try {
      const ok = await onSubmit(pin);
      if (ok) {
        reset();
        onClose();
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } finally {
      setBusy(false);
    }
  };

  const heading =
    title ||
    (mode === 'setup'
      ? step === 'enter'
        ? 'Set a Journal PIN'
        : 'Confirm your PIN'
      : mode === 'remove'
      ? 'Enter current PIN to disable'
      : 'Locked Note');

  const desc =
    subtitle ||
    (mode === 'setup'
      ? 'Used locally to lock and unlock private journal entries.'
      : 'Enter your 4–6 digit PIN to continue.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="tactile-card w-full max-w-sm p-6 relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close PIN modal"
          className="absolute top-4 right-4 w-10 h-10 rounded-xl border-2 border-[#111111] dark:border-zinc-500 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-[2px_2px_0px_#111111]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-[#84C9A6] border-2 border-[#111111] flex items-center justify-center text-[#111111] shadow-[2px_2px_0px_#111111]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">{heading}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{desc}</p>
          </div>
        </div>

        <form onSubmit={handleContinue} className="mt-5 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={step === 'enter' ? pin : confirmPin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (step === 'enter') setPin(val);
              else setConfirmPin(val);
              setError('');
            }}
            placeholder="••••"
            className="w-full text-center font-mono text-2xl tracking-[0.5em] py-3 px-4 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#2D7554]"
          />

          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl border-2 border-[#111111] dark:border-zinc-500 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="tactile-btn flex-1 py-2.5 px-4 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-bold text-sm"
            >
              {mode === 'setup' && step === 'enter' ? 'Next' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
