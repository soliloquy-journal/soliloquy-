import { getMoodMeta, MOODS } from '../constants/moods';
import type { CheckIn, MoodScore, StatsPeriod } from '../types/journal';
import { toDateKey } from './dateUtils';

export function roundMoodScore(avg: number): MoodScore {
  const clamped = Math.max(1, Math.min(6, Math.round(avg)));
  return clamped as MoodScore;
}

export function generateDailyReading(todayCheckIns: CheckIn[], totalCheckInsCount: number): string {
  if (todayCheckIns.length === 0) {
    return 'No check-ins yet today. Take 10 seconds whenever you are ready to notice how things feel.';
  }

  const sorted = [...todayCheckIns].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const avg = sorted.reduce((acc, c) => acc + Math.min(6, c.moodScore), 0) / sorted.length;
  const rounded = roundMoodScore(avg);
  const moodLabel = MOODS[rounded].label.toLowerCase();

  const isFirstDayEver = totalCheckInsCount === todayCheckIns.length;
  if (isFirstDayEver && sorted.length === 1) {
    return `So far, your first day in Journal has been a ${moodLabel} day.`;
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const tagCounts = new Map<string, number>();
  sorted.forEach((c) => c.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
  const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  if (sorted.length === 1) {
    return topTag
      ? `So far today feels ${moodLabel}, shaped around ${topTag.toLowerCase()}.`
      : `So far today has been a ${moodLabel} day.`;
  }

  const delta = last.moodScore - first.moodScore;
  if (delta >= 2) {
    return topTag
      ? `Today lifted noticeably—moving from ${getMoodMeta(first.moodScore).label.toLowerCase()} to ${getMoodMeta(last.moodScore).label.toLowerCase()}, with ${topTag.toLowerCase()} in the mix.`
      : `Your mood picked up across ${sorted.length} check-ins today, landing on ${getMoodMeta(last.moodScore).label.toLowerCase()}.`;
  }
  if (delta <= -2) {
    return `Today shifted from ${getMoodMeta(first.moodScore).label.toLowerCase()} toward ${getMoodMeta(last.moodScore).label.toLowerCase()}. Be gentle with your pace tonight.`;
  }

  return topTag
    ? `Across ${sorted.length} check-ins, today has held steady around ${moodLabel}—with ${topTag.toLowerCase()} showing up.`
    : `Across ${sorted.length} check-ins, today has felt fairly steady around ${moodLabel}.`;
}

export interface TagImpact {
  tag: string;
  count: number;
  avgScore: number;
  deltaFromGlobal: number;
}

export interface StatsSummary {
  startKey: string;
  endKey: string;
  totalDaysInRange: number;
  daysTold: number;
  checkInsInPeriod: CheckIn[];
  checkInsToday: number;
  averageScore: MoodScore | null;
  dayBars: { dateKey: string; dayLabel: string; avgScore: number | null; count: number }[];
  breakdown: { score: MoodScore; count: number; pct: number }[];
  whatHelped: TagImpact[];
  weighedOnYou: TagImpact[];
  swingDays: { dateKey: string; min: MoodScore; max: MoodScore; spread: number }[];
  longestRun: number;
}

export function filterCheckInsByPeriod(checkIns: CheckIn[], period: StatsPeriod, now = new Date()): {
  filtered: CheckIn[];
  startKey: string;
  endKey: string;
  totalDays: number;
} {
  const endKey = toDateKey(now);
  if (period === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const startKey = toDateKey(start);
    return {
      filtered: checkIns.filter((c) => c.dateKey >= startKey && c.dateKey <= endKey),
      startKey,
      endKey,
      totalDays: 7,
    };
  }
  if (period === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    const startKey = toDateKey(start);
    return {
      filtered: checkIns.filter((c) => c.dateKey >= startKey && c.dateKey <= endKey),
      startKey,
      endKey,
      totalDays: 30,
    };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const startKey = toDateKey(start);
    const totalDays = now.getDate();
    return {
      filtered: checkIns.filter((c) => c.dateKey >= startKey && c.dateKey <= endKey),
      startKey,
      endKey,
      totalDays,
    };
  }

  // 'all'
  const sortedKeys = checkIns.map((c) => c.dateKey).sort();
  const startKey = sortedKeys[0] || endKey;
  const startDate = new Date(startKey + 'T12:00:00');
  const totalDays = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  return {
    filtered: checkIns,
    startKey,
    endKey,
    totalDays,
  };
}

export function computeStats(allCheckIns: CheckIn[], period: StatsPeriod, now = new Date()): StatsSummary {
  const todayKey = toDateKey(now);
  const { filtered, startKey, endKey, totalDays } = filterCheckInsByPeriod(allCheckIns, period, now);

  const byDate = new Map<string, CheckIn[]>();
  filtered.forEach((c) => {
    const arr = byDate.get(c.dateKey) || [];
    arr.push(c);
    byDate.set(c.dateKey, arr);
  });

  const daysTold = byDate.size;
  const checkInsToday = allCheckIns.filter((c) => c.dateKey === todayKey).length;

  const averageScore =
    filtered.length > 0
      ? roundMoodScore(filtered.reduce((s, c) => s + c.moodScore, 0) / filtered.length)
      : null;

  // Build day bars (for 7d show 7 bars, for 30d/month/all show up to last 14-30 bars)
  const barCount = period === '7d' ? 7 : Math.min(totalDays, 30);
  const dayBars: { dateKey: string; dayLabel: string; avgScore: number | null; count: number }[] = [];
  for (let i = barCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const items = byDate.get(key) || [];
    const avg = items.length > 0 ? items.reduce((s, c) => s + c.moodScore, 0) / items.length : null;
    dayBars.push({
      dateKey: key,
      dayLabel: String(d.getDate()),
      avgScore: avg,
      count: items.length,
    });
  }

  // Breakdown 6 -> 1
  const countsMap = new Map<MoodScore, number>();
  ([6, 5, 4, 3, 2, 1] as MoodScore[]).forEach((s) => countsMap.set(s, 0));
  filtered.forEach((c) => {
    const clamped = roundMoodScore(c.moodScore);
    countsMap.set(clamped, (countsMap.get(clamped) || 0) + 1);
  });
  const maxCount = Math.max(1, ...countsMap.values());
  const breakdown = ([6, 5, 4, 3, 2, 1] as MoodScore[]).map((score) => {
    const count = countsMap.get(score) || 0;
    return {
      score,
      count,
      pct: count === 0 ? 0 : Math.round((count / maxCount) * 100),
    };
  });

  // Tag analysis
  const globalAvg =
    filtered.length > 0
      ? filtered.reduce((s, c) => s + Math.min(6, c.moodScore), 0) / filtered.length
      : 3.5;
  const tagMap = new Map<string, number[]>();
  filtered.forEach((c) => {
    const scoreVal = Math.min(6, c.moodScore);
    c.tags.forEach((tag) => {
      const list = tagMap.get(tag) || [];
      list.push(scoreVal);
      tagMap.set(tag, list);
    });
  });

  const allTagImpacts: TagImpact[] = [...tagMap.entries()].map(([tag, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      tag,
      count: scores.length,
      avgScore: Number(avg.toFixed(2)),
      deltaFromGlobal: Number((avg - globalAvg).toFixed(2)),
    };
  });

  const whatHelped = allTagImpacts
    .filter((t) => t.avgScore >= 4.2 || (t.deltaFromGlobal > 0.2 && t.avgScore >= 3.5))
    .sort((a, b) => b.avgScore - a.avgScore || b.count - a.count)
    .slice(0, 6);

  const weighedOnYou = allTagImpacts
    .filter((t) => t.avgScore <= 2.8 || t.deltaFromGlobal < -0.2)
    .sort((a, b) => a.avgScore - b.avgScore || b.count - a.count)
    .slice(0, 6);

  // Swing days (within-day spread >= 2)
  const swingDays: { dateKey: string; min: MoodScore; max: MoodScore; spread: number }[] = [];
  byDate.forEach((items, dateKey) => {
    if (items.length < 2) return;
    const scores = items.map((i) => Math.min(6, i.moodScore));
    const min = Math.min(...scores) as MoodScore;
    const max = Math.max(...scores) as MoodScore;
    const spread = max - min;
    if (spread >= 2) {
      swingDays.push({ dateKey, min, max, spread });
    }
  });
  swingDays.sort((a, b) => b.spread - a.spread || b.dateKey.localeCompare(a.dateKey));

  // Longest run (consecutive days with >= 1 check-in)
  const uniqueDates = [...new Set(filtered.map((c) => c.dateKey))].sort();
  let longestRun = 0;
  let currentRun = 0;
  let prevDate: Date | null = null;
  uniqueDates.forEach((key) => {
    const d = new Date(key + 'T12:00:00');
    if (prevDate) {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      currentRun = diffDays === 1 ? currentRun + 1 : 1;
    } else {
      currentRun = 1;
    }
    if (currentRun > longestRun) longestRun = currentRun;
    prevDate = d;
  });

  return {
    startKey,
    endKey,
    totalDaysInRange: totalDays,
    daysTold,
    checkInsInPeriod: filtered,
    checkInsToday,
    averageScore,
    dayBars,
    breakdown,
    whatHelped,
    weighedOnYou,
    swingDays,
    longestRun,
  };
}

export interface PatternsReport {
  totalCheckIns: number;
  globalAvg: number;
  topBoosters: TagImpact[];
  topDrainers: TagImpact[];
  timeOfDay: { bucket: string; range: string; avg: number | null; count: number }[];
  dayOfWeek: { day: string; avg: number | null; count: number }[];
  tagPairs: { pair: [string, string]; avg: number; count: number }[];
}

export function computePatterns(checkIns: CheckIn[]): PatternsReport {
  const totalCheckIns = checkIns.length;
  const globalAvg =
    totalCheckIns > 0
      ? Number((checkIns.reduce((s, c) => s + c.moodScore, 0) / totalCheckIns).toFixed(2))
      : 0;

  const tagMap = new Map<string, number[]>();
  checkIns.forEach((c) => {
    c.tags.forEach((tag) => {
      const arr = tagMap.get(tag) || [];
      arr.push(c.moodScore);
      tagMap.set(tag, arr);
    });
  });

  const impacts: TagImpact[] = [...tagMap.entries()].map(([tag, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      tag,
      count: scores.length,
      avgScore: Number(avg.toFixed(2)),
      deltaFromGlobal: Number((avg - globalAvg).toFixed(2)),
    };
  });

  const topBoosters = [...impacts]
    .filter((i) => i.deltaFromGlobal >= 0)
    .sort((a, b) => b.deltaFromGlobal - a.deltaFromGlobal || b.count - a.count)
    .slice(0, 6);

  const topDrainers = [...impacts]
    .filter((i) => i.deltaFromGlobal < 0)
    .sort((a, b) => a.deltaFromGlobal - b.deltaFromGlobal || b.count - a.count)
    .slice(0, 6);

  // Time of day buckets
  const buckets = [
    { bucket: 'Morning', range: '05:00–11:59', scores: [] as number[] },
    { bucket: 'Afternoon', range: '12:00–16:59', scores: [] as number[] },
    { bucket: 'Evening', range: '17:00–20:59', scores: [] as number[] },
    { bucket: 'Night', range: '21:00–04:59', scores: [] as number[] },
  ];

  checkIns.forEach((c) => {
    const hr = new Date(c.timestamp).getHours();
    if (hr >= 5 && hr < 12) buckets[0].scores.push(c.moodScore);
    else if (hr >= 12 && hr < 17) buckets[1].scores.push(c.moodScore);
    else if (hr >= 17 && hr < 21) buckets[2].scores.push(c.moodScore);
    else buckets[3].scores.push(c.moodScore);
  });

  const timeOfDay = buckets.map((b) => ({
    bucket: b.bucket,
    range: b.range,
    avg: b.scores.length ? Number((b.scores.reduce((x, y) => x + y, 0) / b.scores.length).toFixed(2)) : null,
    count: b.scores.length,
  }));

  // Day of week (Mon -> Sun)
  const dowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dowScores: number[][] = [[], [], [], [], [], [], []];
  checkIns.forEach((c) => {
    const jsDay = new Date(c.dateKey + 'T12:00:00').getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    dowScores[idx].push(c.moodScore);
  });

  const dayOfWeek = dowLabels.map((day, idx) => ({
    day,
    avg: dowScores[idx].length
      ? Number((dowScores[idx].reduce((a, b) => a + b, 0) / dowScores[idx].length).toFixed(2))
      : null,
    count: dowScores[idx].length,
  }));

  // Tag co-occurrence pairs
  const pairMap = new Map<string, { pair: [string, string]; scores: number[] }>();
  checkIns.forEach((c) => {
    const unique = [...new Set(c.tags)].sort();
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = `${unique[i]}|||${unique[j]}`;
        const entry = pairMap.get(key) || { pair: [unique[i], unique[j]], scores: [] };
        entry.scores.push(c.moodScore);
        pairMap.set(key, entry);
      }
    }
  });

  const tagPairs = [...pairMap.values()]
    .filter((p) => p.scores.length >= 2)
    .map((p) => ({
      pair: p.pair,
      avg: Number((p.scores.reduce((a, b) => a + b, 0) / p.scores.length).toFixed(2)),
      count: p.scores.length,
    }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg)
    .slice(0, 5);

  return {
    totalCheckIns,
    globalAvg,
    topBoosters,
    topDrainers,
    timeOfDay,
    dayOfWeek,
    tagPairs,
  };
}
