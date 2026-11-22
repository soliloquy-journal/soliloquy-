import React from 'react';
import { ArrowRight, Bell, ChevronRight, Sparkles, Camera, FileText, PenLine, Plus } from 'lucide-react';
import { TAB_THEMES, getMoodMeta, normalizeMoodScore } from '../constants/moods';
import { useJournal } from '../context/JournalContext';
import { generateDailyReading, roundMoodScore } from '../utils/analytics';
import { formatLongDate, formatShortTime, getLast7DaysKeys, toDateKey } from '../utils/dateUtils';
import { MoodBadge, MoodCharacterSVG } from './MoodCharacters';

const TODAY_THEME = TAB_THEMES.today;

export const TodayView: React.FC = () => {
  const {
    checkIns,
    notes,
    folders,
    settings,
    openNewCheckIn,
    openEditCheckIn,
    updateSettings,
    openDraftNote,
    openNote,
    setActiveTab,
    showToast,
  } = useJournal();

  const now = new Date();
  const todayKey = toDateKey(now);
  const todayCheckIns = checkIns
    .filter((c) => c.dateKey === todayKey)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const todayNotes = notes.filter((n) => n.dateKey === todayKey);

  const latestToday = todayCheckIns[todayCheckIns.length - 1];
  const avgScore =
    todayCheckIns.length > 0
      ? roundMoodScore(todayCheckIns.reduce((s, c) => s + normalizeMoodScore(c.moodScore), 0) / todayCheckIns.length)
      : 5;
  const heroMood = getMoodMeta(latestToday ? latestToday.moodScore : avgScore);

  const greetingName = settings.userName.trim();
  const greeting = greetingName ? `Hello, ${greetingName}` : 'Hello';
  const last7Days = getLast7DaysKeys(now);
  const dailyReadingText = generateDailyReading(todayCheckIns, checkIns.length);

  const handleTurnOnReminder = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission().catch(() => {});
    }
    await updateSettings({ reminderEnabled: true });
    showToast(`Daily reminder set for ${settings.reminderTime}`, 'success');
  };

  const handleWriteToday = () => {
    openDraftNote({ dateKey: todayKey });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          {formatLongDate(now)}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-zinc-100">
          {greeting}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Primary Column: Today's Journal Notes first, Mood Check-in companion below */}
        <div className="lg:col-span-7 space-y-5">
          {/* Today's Journal Notes Spotlight Card (Warm Honey theme matching taskbar) */}
          <section
            className="tactile-card p-5 sm:p-6 space-y-4 text-[#111111]"
            style={{ backgroundColor: TODAY_THEME.accentHex }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p
                  className="text-xs font-extrabold uppercase tracking-wider"
                  style={{ color: TODAY_THEME.subTextOnAccent }}
                >
                  Today&apos;s Journal
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111111]">
                  {todayNotes.length === 0
                    ? 'Capture today in words'
                    : `${todayNotes.length} ${todayNotes.length === 1 ? 'note' : 'notes'} written today`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className="px-3 py-1.5 rounded-xl bg-white text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] text-xs font-extrabold hover:bg-zinc-50 shrink-0"
              >
                All notes
              </button>
            </div>

            {todayNotes.length > 0 && (
              <div className="space-y-2 bg-white/95 dark:bg-[#1B1B20]/95 text-[#111111] dark:text-zinc-100 rounded-xl p-3 border-2 border-[#111111]">
                {todayNotes.slice(0, 4).map((n) => {
                  const folderName = folders.find((f) => f.id === n.folderId)?.name;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNote(n.id)}
                      className="w-full flex items-center justify-between gap-2 py-2 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 opacity-70" />
                        <span className="font-bold text-sm truncate">
                          {n.title || 'Untitled Note'}
                        </span>
                        {folderName && (
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                            · {folderName}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleWriteToday}
              className="tactile-btn w-full py-3.5 px-5 rounded-xl bg-[#111111] text-white font-extrabold text-base flex items-center justify-center gap-2 hover:opacity-95"
            >
              <PenLine className="w-4 h-4" />
              <span>{todayNotes.length === 0 ? "Write today's note" : 'Add another note'}</span>
            </button>
          </section>

          {/* Mood Companion Card */}
          <section
            className="tactile-card p-5 sm:p-6 relative overflow-hidden"
            style={{
              backgroundColor: todayCheckIns.length > 0 ? heroMood.bgHex : TODAY_THEME.tintCardLight,
              color: todayCheckIns.length > 0 ? heroMood.textHex : '#111111',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 z-10">
                <p
                  className="text-xl font-extrabold tracking-tight"
                  style={{ color: todayCheckIns.length > 0 ? heroMood.accentHex : TODAY_THEME.subTextOnAccent }}
                >
                  Mood Check-in
                </p>
                <p className="text-sm font-bold tabular-nums">
                  {todayCheckIns.length === 0
                    ? 'No check-ins yet'
                    : `${todayCheckIns.length} ${todayCheckIns.length === 1 ? 'check-in' : 'check-ins'}`}
                </p>
                <p
                  className="text-2xl font-extrabold tracking-tight pt-0.5"
                  style={{ color: todayCheckIns.length > 0 ? heroMood.accentHex : '#111111' }}
                >
                  {todayCheckIns.length > 0 ? heroMood.label : 'How are you?'}
                </p>
              </div>

              <div className="shrink-0 -my-2 -mr-1">
                <MoodCharacterSVG
                  score={todayCheckIns.length > 0 ? heroMood.score : 4}
                  size={108}
                  withAura={false}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => openNewCheckIn()}
              className="tactile-btn mt-4 w-full py-3 px-5 rounded-xl bg-white text-[#111111] font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-zinc-50"
            >
              <span>What&apos;s your mood?</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>

          {/* Today so far + Check-ins */}
          <section className="tactile-card p-5 sm:p-6 space-y-5 text-[#111111] dark:text-zinc-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight">Today so far</h2>
              <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
                {todayCheckIns.length} {todayCheckIns.length === 1 ? 'check-in' : 'check-ins'}
              </span>
            </div>

            {todayCheckIns.length === 0 ? (
              <div className="py-6 text-center space-y-2 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Your mood timeline will appear here after your first check-in today.
                </p>
                <button
                  type="button"
                  onClick={() => openNewCheckIn()}
                  className="text-sm font-bold underline underline-offset-4 hover:opacity-80 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log a check-in now
                </button>
              </div>
            ) : (
              <>
                {/* Dot Timeline Chart */}
                <div className="relative pt-3 pb-1">
                  <div className="h-28 flex flex-col justify-between relative">
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 w-full" />
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 w-full" />
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 w-full" />
                    <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 w-full" />

                    {/* Connected path + dots */}
                    <svg
                      viewBox="0 0 300 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full overflow-visible"
                    >
                      {todayCheckIns.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity="0.25"
                          strokeWidth="2.5"
                          points={todayCheckIns
                            .map((c, idx) => {
                              const x =
                                todayCheckIns.length === 1
                                  ? 150
                                  : 24 + (idx / (todayCheckIns.length - 1)) * 252;
                              const s = normalizeMoodScore(c.moodScore);
                              const y = 90 - ((s - 1) / 5) * 76;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />
                      )}
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-around px-3">
                      {todayCheckIns.map((c) => {
                        const s = normalizeMoodScore(c.moodScore);
                        const m = getMoodMeta(s);
                        const topPct = 86 - ((s - 1) / 5) * 74;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => openEditCheckIn(c)}
                            title={`${formatShortTime(c.timestamp)} · ${m.label}`}
                            style={{
                              top: `${topPct}%`,
                              backgroundColor: m.bgHex,
                            }}
                            className="relative -translate-y-1/2 w-5 h-5 rounded-md border-2 border-[#111111] dark:border-white shadow-[2px_2px_0px_#111111] transition-transform hover:scale-125"
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-around px-3 mt-2">
                    {todayCheckIns.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono tabular-nums"
                      >
                        {formatShortTime(c.timestamp)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Check-ins list */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                    Check-ins
                  </p>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {[...todayCheckIns].reverse().map((c) => {
                      const mood = getMoodMeta(c.moodScore);
                      const linkedNote = c.linkedNoteId
                        ? notes.find((n) => n.id === c.linkedNoteId)
                        : undefined;
                      const summaryParts = [
                        ...c.tags.slice(0, 3),
                        c.quickNote ? c.quickNote.slice(0, 36) : null,
                      ].filter(Boolean);

                      return (
                        <div
                          key={c.id}
                          className="py-3 flex items-center justify-between gap-3"
                        >
                          <button
                            type="button"
                            onClick={() => openEditCheckIn(c)}
                            className="flex items-center gap-3.5 text-left flex-1 min-w-0 group"
                          >
                            <MoodBadge score={c.moodScore} size={42} />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm sm:text-base tabular-nums truncate">
                                {formatShortTime(c.timestamp)}, {mood.label}
                              </p>
                              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                                {summaryParts.length > 0
                                  ? summaryParts.join(' · ')
                                  : 'No reason added'}
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 shrink-0">
                            {c.photoDataUrl && (
                              <span
                                title="Photo attached"
                                className="text-zinc-500 dark:text-zinc-400"
                              >
                                <Camera className="w-4 h-4" />
                              </span>
                            )}
                            {linkedNote && (
                              <button
                                type="button"
                                onClick={() => openNote(linkedNote.id)}
                                title="Open linked journal note"
                                className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-bold flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Note
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditCheckIn(c)}
                              aria-label="Edit check-in"
                              className="p-2 text-zinc-400 hover:text-[#111111] dark:hover:text-white"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Secondary Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Today's Reading */}
          {settings.dailyReading && (
            <section className="tactile-card p-5 sm:p-6 space-y-2.5 text-[#111111] dark:text-zinc-100">
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-0.5 rounded-lg border border-[#111111] text-[11px] font-extrabold tracking-wider uppercase text-[#111111]"
                  style={{ backgroundColor: TODAY_THEME.accentHex }}
                >
                  Today&apos;s reading
                </span>
                <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <p className="text-base sm:text-lg font-bold leading-snug">{dailyReadingText}</p>
            </section>
          )}

          {/* Last 7 Days Strip */}
          <section className="tactile-card p-5 sm:p-6 space-y-4 text-[#111111] dark:text-zinc-100">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                Last 7 days
              </p>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 text-right leading-tight">
                {
                  new Set(
                    checkIns
                      .filter((c) => last7Days.some((d) => d.dateKey === c.dateKey))
                      .map((c) => c.dateKey)
                  ).size
                }{' '}
                {new Set(
                  checkIns
                    .filter((c) => last7Days.some((d) => d.dateKey === c.dateKey))
                    .map((c) => c.dateKey)
                ).size === 1
                  ? 'day'
                  : 'days'}{' '}
                with an entry · blank days are just blank
              </p>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {last7Days.map((day) => {
                const dayEntries = checkIns.filter((c) => c.dateKey === day.dateKey);
                const hasEntry = dayEntries.length > 0;
                const dayAvg = hasEntry
                  ? roundMoodScore(
                      dayEntries.reduce((s, c) => s + c.moodScore, 0) / dayEntries.length
                    )
                  : null;

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => openNewCheckIn(undefined, day.dateKey)}
                    className="flex flex-col items-center gap-1.5 group"
                    title={day.dateKey}
                  >
                    <div
                      className={`w-full aspect-[3/4.2] rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:-translate-y-0.5 ${
                        dayAvg
                          ? 'border-2 border-[#111111] dark:border-zinc-200 shadow-[2px_2px_0px_#111111]'
                          : 'border-2 border-dashed border-zinc-300 dark:border-zinc-700'
                      }`}
                      style={dayAvg ? { backgroundColor: getMoodMeta(dayAvg).bgHex } : undefined}
                    >
                      {dayAvg ? (
                        <MoodCharacterSVG score={dayAvg} size={40} withAura={false} />
                      ) : null}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        day.dateKey === todayKey
                          ? 'text-[#111111] dark:text-white'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {day.dayShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Evening Reminder Prompt */}
          {!settings.reminderEnabled && (
            <section className="tactile-card p-5 sm:p-6 space-y-4 text-[#111111] dark:text-zinc-100">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold">An evening reminder?</h2>
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    One gentle notification at the time you choose while the app is open.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Time</span>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => updateSettings({ reminderTime: e.target.value })}
                  className="px-3.5 py-1.5 rounded-xl border-2 border-[#111111] dark:border-zinc-500 bg-transparent text-[#111111] dark:text-zinc-100 font-mono font-bold text-sm"
                />
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You can change the time now or later in Settings.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTurnOnReminder}
                  className="tactile-btn px-5 py-2.5 rounded-xl bg-[#18181B] text-white dark:bg-white dark:text-[#111111] font-bold text-sm"
                >
                  Turn it on
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="px-3 py-2.5 font-bold text-sm text-zinc-600 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white"
                >
                  Settings
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
