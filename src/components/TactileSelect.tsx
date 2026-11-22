import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface TactileSelectOption<T extends string = string> {
  value: T;
  label: string;
  dotColor?: string;
}

interface TactileSelectProps<T extends string = string> {
  value: T;
  options: TactileSelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  compact?: boolean;
  align?: 'left' | 'right';
  className?: string;
}

export function TactileSelect<T extends string = string>({
  value,
  options,
  onChange,
  ariaLabel,
  compact = false,
  align = 'left',
  className = '',
}: TactileSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const current = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`tactile-card-sm w-full flex items-center justify-between gap-2.5 text-left transition-transform active:translate-y-0.5 cursor-pointer bg-white dark:bg-[#1B1B20] text-[#111111] dark:text-zinc-100 rounded-xl ${
          compact ? 'px-3.5 py-2 text-xs sm:text-sm' : 'px-4 py-3 text-sm sm:text-base'
        }`}
      >
        <span className="flex items-center gap-2 font-bold truncate">
          {current?.dotColor && (
            <span
              className="w-2.5 h-2.5 rounded-full border border-[#111111] shrink-0"
              style={{ backgroundColor: current.dotColor }}
            />
          )}
          <span className="truncate">{current?.label}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-zinc-600 dark:text-zinc-300 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`tactile-card-sm absolute z-50 mt-2 min-w-[180px] w-full max-h-64 overflow-y-auto p-1.5 bg-white dark:bg-[#1F1F25] text-[#111111] dark:text-zinc-100 space-y-0.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={selected ? { backgroundColor: 'var(--tab-accent, #84C9A6)' } : undefined}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-colors ${
                  compact ? 'text-xs sm:text-sm' : 'text-sm'
                } ${
                  selected
                    ? 'text-[#111111] font-extrabold'
                    : 'font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#111111] dark:text-zinc-100'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {opt.dotColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-[#111111] shrink-0"
                      style={{ backgroundColor: opt.dotColor }}
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                {selected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
