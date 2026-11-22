import React, { useState } from 'react';
import { TAB_THEMES, getMoodMeta } from '../constants/moods';
import { useJournal } from '../context/JournalContext';
import type { StatsPeriod } from '../types/journal';
import { computeStats, roundMoodScore } from '../utils/analytics';
import { formatDateRange, fromDateKey } from '../utils/dateUtils';
import { MoodBadge, StatsTrioIllustration } from './MoodCharacters';
import { TactileSelect } from './TactileSelect';

const STATS_THEME = TAB_THEMES.stats;

const PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'all', label: 'All time' },
];

export const StatsView: React.FC = () => {
  const { checkIns, openNewCheckIn } = useJournal();
  const [period, setPeriod] = useState<StatsPeriod>('7d');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [tagTab, setTagTab] = useState<'helped' | 'weighed'>('helped');

  const stats = computeStats(checkIns, period);
  const selectedDayCheckIns = selectedDayKey
    ? stats.checkInsInPeriod.filter((c) => c.dateKey === selectedDayKey)
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-zinc-100">
          Stats
        </h1>
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {formatDateRange(stats.startKey, stats.endKey)} · {stats.totalDaysInRange}{' '}
          {stats.totalDaysInRange === 1 ? 'day' : 'days'}
        </p>
      </header>

      {/* Period Dropdown */}
      <div className="max-w-sm">
        <TactileSelect
          value={period}
          options={PERIOD_OPTIONS}
          onChange={(val) => {
            setPeriod(val);
            setSelectedDayKey(null);
          }}
          ariaLabel="Stats time period"
        />
      </div>

      {/* Summary 3-column Metric Card */}
      <section className="tactile-card overflow-hidden">
        <div
          className="px-5 py-2 border-b-2 border-[#111111] flex items-center justify-between text-[#111111]"
          style={{ backgroundColor: STATS_THEME.accentHex }}
        >
          <span className="text-xs font-extrabold uppercase tracking-wider">
            Period Snapshot
          </span>
          <span className="font-mono text-xs font-extrabold tabular-nums">
            {stats.checkInsInPeriod.length} entries
          </span>
        </div>
        <div className="p-5 grid grid-cols-3 gap-3 items-center">
          <div className="space-y-1.5">
            {stats.averageScore ? (
              <MoodBadge score={stats.averageScore} size={40} />
            ) : (
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700" />
            )}
            <p className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">
              average: {stats.averageScore ? getMoodMeta(stats.averageScore).label : '—'}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-none">
              {stats.daysTold}
              <span className="text-base text-zinc-500">/{stats.totalDaysInRange}</span>
            </p>
            <p className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">
              days told
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-none">
              {stats.checkInsToday}
            </p>
            <p className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">
              check-ins today
            </p>
          </div>
        </div>
      </section>

      {checkIns.length === 0 ? (
        <div className="tactile-card p-8 text-center space-y-3">
          <h2 className="text-xl font-extrabold">No check-ins recorded yet</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Log your first mood check-in to unlock day-by-day charts, mood breakdowns, and habit insights.
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-5">
            {/* Day by day Bar Chart */}
            <section className="tactile-card p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold tracking-tight">Day by day</h2>
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  tap a day
                </span>
              </div>

              <div className="h-44 flex items-end gap-2 pt-2">
                {stats.dayBars.map((bar) => {
                  const score = bar.avgScore ? roundMoodScore(bar.avgScore) : null;
                  const heightPct = bar.avgScore ? Math.max(18, (bar.avgScore / 6) * 100) : 4;
                  const isSelected = selectedDayKey === bar.dateKey;

                  return (
                    <button
                      key={bar.dateKey}
                      type="button"
                      onClick={() =>
                        setSelectedDayKey((prev) => (prev === bar.dateKey ? null : bar.dateKey))
                      }
                      className="flex-1 h-full flex flex-col items-center justify-end gap-2 group focus:outline-none"
                    >
                      <div className="w-full flex-1 flex items-end justify-center">
                        {score ? (
                          <div
                            style={{
                              height: `${heightPct}%`,
                              backgroundColor: getMoodMeta(score).bgHex,
                            }}
                            className={`w-full max-w-[44px] rounded-xl border-2 shadow-[2px_2px_0px_#111111] transition-transform group-hover:-translate-y-0.5 relative overflow-hidden ${
                              isSelected
                                ? 'border-[#111111] ring-2 ring-[#111111] dark:ring-white'
                                : 'border-[#111111] dark:border-zinc-200'
                            }`}
                          >
                            <div className="absolute inset-y-0 right-0 w-1/2 bg-black/10 pointer-events-none" />
                          </div>
                        ) : (
                          <div className="w-full max-w-[38px] h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          isSelected
                            ? 'font-extrabold text-[#111111] dark:text-white'
                            : 'font-semibold text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {bar.dayLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedDayKey && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                  <p className="font-extrabold">
                    {fromDateKey(selectedDayKey).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {selectedDayCheckIns.length === 0 ? (
                    <p className="text-zinc-500">No check-ins on this day.</p>
                  ) : (
                    <p className="text-zinc-600 dark:text-zinc-300 font-medium">
                      {selectedDayCheckIns.length} check-in(s):{' '}
                      {selectedDayCheckIns.map((c) => getMoodMeta(c.moodScore).label).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Mood Breakdown */}
            <section className="tactile-card p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-extrabold tracking-tight">Mood breakdown</h2>

              <div className="space-y-3">
                {stats.breakdown.map((row) => {
                  const mood = getMoodMeta(row.score);
                  return (
                    <div key={row.score} className="flex items-center gap-3">
                      <MoodBadge score={row.score} size={32} />
                      <span className="w-24 text-sm font-bold shrink-0">{mood.statsLabel}</span>
                      <div className="flex-1 h-5 rounded-lg border-2 border-[#111111] dark:border-zinc-200 overflow-hidden bg-transparent">
                        {row.count > 0 && (
                          <div
                            className="h-full rounded-sm transition-all duration-300"
                            style={{
                              width: `${Math.max(10, row.pct)}%`,
                              backgroundColor: mood.bgHex,
                            }}
                          />
                        )}
                      </div>
                      <span className="w-6 text-right font-mono font-extrabold text-sm tabular-nums">
                        {row.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-6 space-y-5">
            {/* What helped / Things that weighed on you */}
            <section className="tactile-card p-5 sm:p-6 space-y-4">
              <StatsTrioIllustration />

              <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTagTab('helped')}
                  className={`pb-2.5 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-colors ${
                    tagTab === 'helped'
                      ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white'
                      : 'border-transparent text-zinc-500'
                  }`}
                >
                  <span>What helped</span>
                  <span
                    style={
                      tagTab === 'helped'
                        ? { backgroundColor: STATS_THEME.accentHex, color: '#111111' }
                        : undefined
                    }
                    className={`px-2 py-0.5 rounded-full text-xs font-mono tabular-nums border ${
                      tagTab === 'helped'
                        ? 'border-[#111111]'
                        : 'border-transparent bg-zinc-200 dark:bg-zinc-700 text-[#111111] dark:text-white'
                    }`}
                  >
                    {stats.whatHelped.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTagTab('weighed')}
                  className={`pb-2.5 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-colors ${
                    tagTab === 'weighed'
                      ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white'
                      : 'border-transparent text-zinc-500'
                  }`}
                >
                  <span>Things that weighed on you</span>
                  <span
                    style={
                      tagTab === 'weighed'
                        ? { backgroundColor: STATS_THEME.accentHex, color: '#111111' }
                        : undefined
                    }
                    className={`px-2 py-0.5 rounded-full text-xs font-mono tabular-nums border ${
                      tagTab === 'weighed'
                        ? 'border-[#111111]'
                        : 'border-transparent bg-zinc-200 dark:bg-zinc-700 text-[#111111] dark:text-white'
                    }`}
                  >
                    {stats.weighedOnYou.length}
                  </span>
                </button>
              </div>

              {(() => {
                const list = tagTab === 'helped' ? stats.whatHelped : stats.weighedOnYou;
                if (list.length === 0) {
                  return (
                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-2">
                      None in this period.
                    </p>
                  );
                }
                return (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {list.map((item) => {
                      const rounded = roundMoodScore(item.avgScore);
                      return (
                        <div
                          key={item.tag}
                          className="py-2.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <MoodBadge score={rounded} size={26} />
                            <span className="font-bold text-sm">{item.tag}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                            {item.avgScore}/6 · {item.count}x
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>

            {/* Swing days */}
            <section className="tactile-card p-5 sm:p-6 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold tracking-tight">Swing days</h2>
                <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                  {stats.swingDays.length} {stats.swingDays.length === 1 ? 'day' : 'days'}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                The days your mood moved most within the day.
              </p>

              {stats.swingDays.length === 0 ? (
                <p className="text-sm font-bold pt-1">No clear swing days in this period.</p>
              ) : (
                <div className="space-y-2 pt-1">
                  {stats.swingDays.slice(0, 4).map((s) => (
                    <div
                      key={s.dateKey}
                      className="flex items-center justify-between text-sm font-semibold py-1"
                    >
                      <span>
                        {fromDateKey(s.dateKey).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {getMoodMeta(s.min).label} → {getMoodMeta(s.max).label} (+{s.spread})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Longest run */}
            <section className="tactile-card p-5 sm:p-6 space-y-2">
              <h2 className="text-lg font-extrabold tracking-tight">Longest run</h2>
              <p className="text-4xl font-black font-display tabular-nums">
                {stats.longestRun} {stats.longestRun === 1 ? 'day' : 'days'}
              </p>
              <p className="text-sm font-bold">
                {stats.longestRun <= 1
                  ? 'No two days in a row yet.'
                  : `${stats.longestRun} consecutive days checked in.`}
              </p>
              <p className="text-xs italic text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                An empty day is neutral: a run doesn&apos;t break, a new one starts.
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
