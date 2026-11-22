import type { EditorBlock, MainTab, MoodMeta, MoodScore, NoteStyle, TagCategory } from '../types/journal';

export interface TabThemeConfig {
  id: MainTab;
  accentHex: string;
  deepHex: string;
  pageBgLight: string;
  pageBgDark: string;
  tintCardLight: string;
  textOnAccent: string;
  subTextOnAccent: string;
}

export const TAB_THEMES: Record<MainTab, TabThemeConfig> = {
  journal: {
    id: 'journal',
    accentHex: '#84C9A6', // Sage Mint
    deepHex: '#2D7554',
    pageBgLight: '#EFF7F2',
    pageBgDark: '#111614',
    tintCardLight: '#E1F1E8',
    textOnAccent: '#111111',
    subTextOnAccent: '#0A2E1E',
  },
  today: {
    id: 'today',
    accentHex: '#E8C974', // Warm Honey
    deepHex: '#9B7B22',
    pageBgLight: '#FAF5E6',
    pageBgDark: '#16140F',
    tintCardLight: '#F4EAC8',
    textOnAccent: '#111111',
    subTextOnAccent: '#332605',
  },
  stats: {
    id: 'stats',
    accentHex: '#DF9BB9', // Dusty Rose
    deepHex: '#944369',
    pageBgLight: '#F9EFF3',
    pageBgDark: '#171215',
    tintCardLight: '#F2DCE5',
    textOnAccent: '#111111',
    subTextOnAccent: '#3A1124',
  },
  patterns: {
    id: 'patterns',
    accentHex: '#7CA8DB', // Calm Slate Sky
    deepHex: '#2F598C',
    pageBgLight: '#EEF4FA',
    pageBgDark: '#11151B',
    tintCardLight: '#DCE8F6',
    textOnAccent: '#111111',
    subTextOnAccent: '#0B213D',
  },
  settings: {
    id: 'settings',
    accentHex: '#E5A27A', // Soft Apricot
    deepHex: '#A65C2E',
    pageBgLight: '#FAF1EC',
    pageBgDark: '#171311',
    tintCardLight: '#F4E0D4',
    textOnAccent: '#111111',
    subTextOnAccent: '#3B1B09',
  },
};

export const MOODS: Record<MoodScore, MoodMeta> = {
  1: {
    score: 1,
    label: 'Burned Out',
    statsLabel: 'Burned Out',
    bgHex: '#A98FD3', // Dusty Lavender Plum
    surfaceHex: '#5C4384',
    accentHex: '#23163B',
    textHex: '#111111',
    subTextHex: '#2E1E4A',
    isLightBg: true,
  },
  2: {
    score: 2,
    label: 'Low',
    statsLabel: 'Low',
    bgHex: '#E88B84', // Soft Terracotta Clay
    surfaceHex: '#AD4942',
    accentHex: '#3B110E',
    textHex: '#111111',
    subTextHex: '#4A1814',
    isLightBg: true,
  },
  3: {
    score: 3,
    label: 'Neutral',
    statsLabel: 'Neutral',
    bgHex: '#EAA97C', // Warm Apricot Sandstone
    surfaceHex: '#A65C2E',
    accentHex: '#381B08',
    textHex: '#111111',
    subTextHex: '#47240D',
    isLightBg: true,
  },
  4: {
    score: 4,
    label: 'Calm',
    statsLabel: 'Calm',
    bgHex: '#E8C974', // Warm Honey Ochre
    surfaceHex: '#9B7B22',
    accentHex: '#332605',
    textHex: '#111111',
    subTextHex: '#423208',
    isLightBg: true,
  },
  5: {
    score: 5,
    label: 'Happy',
    statsLabel: 'Happy',
    bgHex: '#84C9A6', // Sage Mint
    surfaceHex: '#2D7554',
    accentHex: '#0A2E1E',
    textHex: '#111111',
    subTextHex: '#103D29',
    isLightBg: true,
  },
  6: {
    score: 6,
    label: 'Unstoppable',
    statsLabel: 'Unstoppable',
    bgHex: '#7CA8DB', // Calm Slate Cobalt
    surfaceHex: '#2F598C',
    accentHex: '#0B213D',
    textHex: '#111111',
    subTextHex: '#122E52',
    isLightBg: true,
  },
};

export const MOOD_LIST: MoodMeta[] = [
  MOODS[6],
  MOODS[5],
  MOODS[4],
  MOODS[3],
  MOODS[2],
  MOODS[1],
];

export function normalizeMoodScore(score: number): MoodScore {
  const clamped = Math.max(1, Math.min(6, Math.round(score || 1)));
  return clamped as MoodScore;
}

export function getMoodMeta(score: number): MoodMeta {
  return MOODS[normalizeMoodScore(score)];
}

export const TAG_CATEGORIES: { category: TagCategory; tags: string[] }[] = [
  {
    category: 'Mindset',
    tags: [
      'Clear-headed',
      'Driven',
      'Content',
      'Hopeful',
      'Peaceful',
      'Restless',
      'Scattered',
      'Irritable',
      'Overwhelmed',
      'Down',
    ],
  },
  {
    category: 'Energy & Health',
    tags: [
      'Deep sleep',
      'Short sleep',
      'Refreshed',
      'Low energy',
      'Exhausted',
      'Hydrated',
      'Home-cooked meal',
      'Too much caffeine',
      'Headache',
      'Sore',
      'Fresh air',
    ],
  },
  {
    category: 'Habits',
    tags: [
      'Morning walk',
      'Workout',
      'Reading',
      'Deep focus',
      'Listening to music',
      'Cooking',
      'Creative project',
      'Journaling',
      'Quiet stretch',
      'Too much screen time',
    ],
  },
  {
    category: 'Social',
    tags: [
      'Friends',
      'Family',
      'Partner',
      'Solo recharge',
      'Heart-to-heart',
      'Teamwork',
      'Tension',
      'Missed someone',
    ],
  },
  {
    category: 'Work & Goals',
    tags: [
      'Big progress',
      'Breakthrough',
      'Study session',
      'Heavy workload',
      'Meeting marathon',
      'Deadline crunch',
      'Day off',
      'Procrastinating',
    ],
  },
  {
    category: 'Around Me',
    tags: [
      'Sunny outside',
      'Rainy & gray',
      'Cozy at home',
      'Nature time',
      'Out & about',
      'Long commute',
      'Loud space',
      'Good news',
      'Unexpected change',
    ],
  },
  {
    category: 'Skipped',
    tags: [
      'Skipping workout',
      'Skipped water',
      'Put off chores',
      'Delayed tough talk',
      'Late bedtime',
      'Missed study',
      'Ignored inbox',
    ],
  },
];

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  createBlocks: () => EditorBlock[];
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    description: 'Highlights, challenges, and one intention for tomorrow',
    createBlocks: () => [
      { id: crypto.randomUUID(), type: 'h2', html: 'What stood out today?' },
      { id: crypto.randomUUID(), type: 'paragraph', html: '' },
      { id: crypto.randomUUID(), type: 'h2', html: 'Three small wins' },
      { id: crypto.randomUUID(), type: 'checklist', html: 'First win...', checked: false },
      { id: crypto.randomUUID(), type: 'checklist', html: 'Second win...', checked: false },
      { id: crypto.randomUUID(), type: 'callout', html: 'One kind reminder for tomorrow: pace yourself.', calloutVariant: 'tip' },
    ],
  },
  {
    id: 'gratitude',
    name: 'Gratitude Log',
    description: 'Simple grounding appreciation prompts',
    createBlocks: () => [
      { id: crypto.randomUUID(), type: 'washi', html: 'Gratitude', washiVariant: 'mint' },
      { id: crypto.randomUUID(), type: 'h2', html: 'Things I am grateful for right now' },
      { id: crypto.randomUUID(), type: 'bullet', html: 'A moment of calm...' },
      { id: crypto.randomUUID(), type: 'bullet', html: 'Someone who helped or listened...' },
      { id: crypto.randomUUID(), type: 'rating', html: 'Day peace rating', ratingValue: 4 },
    ],
  },
  {
    id: 'brain-dump',
    name: 'Mind Unload',
    description: 'Clear noisy thoughts and sort next actions',
    createBlocks: () => [
      { id: crypto.randomUUID(), type: 'h2', html: 'Everything on my mind' },
      { id: crypto.randomUUID(), type: 'paragraph', html: '' },
      { id: crypto.randomUUID(), type: 'divider', html: '', dividerStyle: 'wavy' },
      { id: crypto.randomUUID(), type: 'h3', html: 'What actually needs action' },
      { id: crypto.randomUUID(), type: 'checklist', html: 'Next tiny step', checked: false },
    ],
  },
  {
    id: 'weekly-review',
    name: 'Weekly Check-in',
    description: 'Energy audit, wins, and habits to carry forward',
    createBlocks: () => [
      { id: crypto.randomUUID(), type: 'callout', html: 'Weekly Reset — Reflect without judgement.', calloutVariant: 'keyidea' },
      { id: crypto.randomUUID(), type: 'h2', html: 'What gave me energy' },
      { id: crypto.randomUUID(), type: 'bullet', html: '' },
      { id: crypto.randomUUID(), type: 'h2', html: 'What drained me' },
      { id: crypto.randomUUID(), type: 'bullet', html: '' },
      { id: crypto.randomUUID(), type: 'toggle', html: 'Focus goals for next week', toggleOpen: true, childrenHtml: 'Keep sleep steady and take a daily 15-minute walk.' },
    ],
  },
];

export const STICKER_PACK = [
  { id: 'sunbeam', label: 'Sunbeam' },
  { id: 'sprout', label: 'Sprout' },
  { id: 'spark', label: 'Spark' },
  { id: 'cloud', label: 'Cozy Cloud' },
  { id: 'heart', label: 'Warm Heart' },
  { id: 'moon', label: 'Night Moon' },
  { id: 'coffee', label: 'Warm Cup' },
  { id: 'star', label: 'Gold Star' },
];

export const WASHI_VARIANTS = [
  { id: 'mint', label: 'Mint Dots', bg: 'bg-[#84C9A6]/80 text-[#0A2E1E] border-[#2D7554]/30' },
  { id: 'pink', label: 'Blossom Stripe', bg: 'bg-[#DF9BB9]/75 text-[#3A1124] border-[#944369]/30' },
  { id: 'amber', label: 'Honey Grid', bg: 'bg-[#E8C974]/75 text-[#332605] border-[#9B7B22]/30' },
  { id: 'plum', label: 'Twilight', bg: 'bg-[#A98FD3]/45 text-[#23163B] dark:text-[#E9D5FF] border-[#5C4384]/30' },
  { id: 'sky', label: 'Denim Tape', bg: 'bg-[#7CA8DB]/45 text-[#0B213D] dark:text-[#BFDBFE] border-[#2F598C]/30' },
];

export const PAPER_STYLES: Record<NoteStyle['paper'], { label: string; lightClass: string; darkClass: string; swatch: string }> = {
  default: {
    label: 'Crisp Paper',
    lightClass: 'bg-white text-zinc-900',
    darkClass: 'dark:bg-[#16161A] dark:text-zinc-100',
    swatch: '#FFFFFF',
  },
  warm: {
    label: 'Warm Cream',
    lightClass: 'bg-[#FBF7EE] text-stone-900',
    darkClass: 'dark:bg-[#1E1B16] dark:text-stone-100',
    swatch: '#FBF7EE',
  },
  sage: {
    label: 'Soft Sage',
    lightClass: 'bg-[#EFF8F3] text-emerald-950',
    darkClass: 'dark:bg-[#131F19] dark:text-emerald-50',
    swatch: '#EFF8F3',
  },
  lavender: {
    label: 'Calm Mist',
    lightClass: 'bg-[#F4F1FA] text-purple-950',
    darkClass: 'dark:bg-[#1A1622] dark:text-purple-50',
    swatch: '#F4F1FA',
  },
  rose: {
    label: 'Blush Note',
    lightClass: 'bg-[#FDF2F7] text-rose-950',
    darkClass: 'dark:bg-[#22151B] dark:text-rose-50',
    swatch: '#FDF2F7',
  },
  midnight: {
    label: 'Midnight Ink',
    lightClass: 'bg-[#18181D] text-zinc-100',
    darkClass: 'dark:bg-[#0D0D10] dark:text-zinc-100',
    swatch: '#18181D',
  },
};
