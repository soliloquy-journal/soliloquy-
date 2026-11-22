import React from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, CalendarDays, Layers } from 'lucide-react';
import { TAB_THEMES, getMoodMeta } from '../constants/moods';
import { useJournal } from '../context/JournalContext';
import { computePatterns, roundMoodScore } from '../utils/analytics';
import { MoodBadge } from './MoodCharacters';

const PATTERNS_THEME = TAB_THEMES.patterns;

export const PatternsView: React.FC = () => {
  const { checkIns, openNewCheckIn } = useJournal();
  const report = computePatterns(checkIns);

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Patterns</h1>
          <span
            className="px-2.5 py-0.5 rounded-lg border-2 border-[#111111] text-xs font-extrabold text-[#111111]"
            style={{ backgroundColor: PATTERNS_THEME.accentHex }}
          >
            {report.totalCheckIns} check-ins
          </span>
        </div>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          On-device tag correlations and mood rhythms
        </p>
      </header>

      {checkIns.length === 0 ? (
        <div className="tactile-card p-8 text-center space-y-3">
          <h2 className="text-xl font-extrabold">Patterns emerge over time</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            As you tag activities, people, sleep, and feelings during check-ins, Soliloquy computes which habits lift your mood and when you feel your best—100% locally.
          </p>
          <button
            type="button"
            onClick={() => openNewCheckIn()}
            className="tactile-btn px-6 py-3 rounded-xl bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-bold text-sm"
          >
            Log First Check-In
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Boosters & Drainers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="tactile-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Top mood boosters</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tags paired with higher-than-average check-ins
                  </p>
                </div>
                <span className="w-9 h-9 rounded-xl bg-[#84C9A6] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-[#0A2E1E]" />
                </span>
              </div>

              {report.topBoosters.length === 0 ? (
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-2">
                  Add tags to your check-ins to surface uplifting habits.
                </p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {report.topBoosters.map((item) => (
                    <div key={item.tag} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MoodBadge score={roundMoodScore(item.avgScore)} size={30} />
                        <div>
                          <p className="font-bold text-sm">{item.tag}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                            {item.count} {item.count === 1 ? 'entry' : 'entries'}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-[#2D7554] dark:text-[#84C9A6] tabular-nums">
                        {item.deltaFromGlobal >= 0 ? `+${item.deltaFromGlobal}` : item.deltaFromGlobal} vs avg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="tactile-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Mood drainers</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tags appearing when energy or mood dips
                  </p>
                </div>
                <span className="w-9 h-9 rounded-xl bg-[#E88B84] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-4 h-4 text-[#3B110E]" />
                </span>
              </div>

              {report.topDrainers.length === 0 ? (
                <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-2">
                  No negative correlations detected yet.
                </p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {report.topDrainers.map((item) => (
                    <div key={item.tag} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MoodBadge score={roundMoodScore(item.avgScore)} size={30} />
                        <div>
                          <p className="font-bold text-sm">{item.tag}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                            {item.count} {item.count === 1 ? 'entry' : 'entries'}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-[#AD4942] dark:text-[#E88B84] tabular-nums">
                        {item.deltaFromGlobal} vs avg
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Time of Day & Day of Week */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="tactile-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold tracking-tight">Time-of-day rhythm</h2>
                <span
                  className="w-9 h-9 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: PATTERNS_THEME.accentHex }}
                >
                  <Clock className="w-4 h-4 text-[#111111]" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {report.timeOfDay.map((slot) => {
                  const score = slot.avg ? roundMoodScore(slot.avg) : null;
                  return (
                    <div
                      key={slot.bucket}
                      className="p-3.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold">{slot.bucket}</span>
                        {score && <MoodBadge score={score} size={24} />}
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">{slot.range}</p>
                      <p className="text-xs font-bold font-mono tabular-nums">
                        {slot.avg !== null && score ? `${getMoodMeta(score).label} (${slot.avg}/6)` : 'No entries'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="tactile-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold tracking-tight">Day-of-week flow</h2>
                <span
                  className="w-9 h-9 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: PATTERNS_THEME.accentHex }}
                >
                  <CalendarDays className="w-4 h-4 text-[#111111]" />
                </span>
              </div>

              <div className="h-36 flex items-end gap-2 pt-2">
                {report.dayOfWeek.map((d) => {
                  const score = d.avg ? roundMoodScore(d.avg) : null;
                  const h = d.avg ? Math.max(18, (d.avg / 6) * 100) : 6;
                  return (
                    <div key={d.day} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          style={{
                            height: `${h}%`,
                            backgroundColor: score ? getMoodMeta(score).bgHex : undefined,
                          }}
                          className={`w-full max-w-[38px] rounded-xl ${
                            score
                              ? 'border-2 border-[#111111] dark:border-zinc-200 shadow-[2px_2px_0px_#111111]'
                              : 'bg-zinc-200 dark:bg-zinc-700'
                          }`}
                          title={d.avg ? `${d.day}: ${d.avg}/6 (${d.count}x)` : `${d.day}: no entries`}
                        />
                      </div>
                      <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Recurring Combinations */}
          <section className="tactile-card p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold tracking-tight">Recurring tag combinations</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pairs of feelings or activities that show up together
                </p>
              </div>
              <span
                className="w-9 h-9 rounded-xl border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center justify-center shrink-0"
                style={{ backgroundColor: PATTERNS_THEME.accentHex }}
              >
                <Layers className="w-4 h-4 text-[#111111]" />
              </span>
            </div>

            {report.tagPairs.length === 0 ? (
              <p className="text-sm font-semibold text-zinc-500 py-2">
                Log at least two check-ins with multiple tags to uncover combinations.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.tagPairs.map((p) => {
                  const score = roundMoodScore(p.avg);
                  return (
                    <div
                      key={p.pair.join('+')}
                      className="p-3.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {p.pair[0]} + {p.pair[1]}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono tabular-nums">
                          {p.count}x · avg {p.avg}/6
                        </p>
                      </div>
                      <MoodBadge score={score} size={28} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
