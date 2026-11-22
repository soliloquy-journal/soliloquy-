import { getMoodMeta } from '../constants/moods';
import type { CheckIn, EditorBlock, JournalNote, MoodMeta } from '../types/journal';
import { formatLongDate, fromDateKey } from './dateUtils';

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function shareAppWithFriend(): Promise<'shared' | 'copied' | 'cancelled'> {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const payload = {
    title: 'Soliloquy — Private Local Journal & Mood Companion',
    text: 'Try Soliloquy — a clean, offline-first personal journal & mood tracker that keeps everything privately on your device.',
    url,
  };

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
      // If navigator.share fails on desktop/unsupported host, fall back to copying URL
    }
  }

  await copyToClipboard(url);
  return 'copied';
}

export function resolveEntryMood(note: JournalNote, checkIns: CheckIn[]): MoodMeta | null {
  if (note.linkedCheckInId) {
    const linked = checkIns.find((c) => c.id === note.linkedCheckInId);
    if (linked) return getMoodMeta(linked.moodScore);
  }

  const moodBlock = note.blocks.find((b) => b.type === 'mood' && typeof b.moodScore === 'number');
  if (moodBlock?.moodScore) {
    return getMoodMeta(moodBlock.moodScore);
  }

  const sameDay = checkIns
    .filter((c) => c.dateKey === note.dateKey)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (sameDay.length > 0) {
    return getMoodMeta(sameDay[0].moodScore);
  }

  return null;
}

function stripHtmlPlain(html: string): string {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\u00a0/g, ' ').trim();
}

function extractEntryLines(blocks: EditorBlock[]): string[] {
  const lines: string[] = [];
  let numberedIdx = 0;

  blocks.forEach((b) => {
    const text = stripHtmlPlain(b.html);
    if (b.type !== 'numbered') numberedIdx = 0;

    switch (b.type) {
      case 'h1':
      case 'h2':
      case 'h3':
        if (text) lines.push(text);
        break;
      case 'quote':
      case 'pullquote':
        if (text) lines.push(`“${text}”`);
        break;
      case 'callout':
        if (text) lines.push(`[${(b.calloutVariant || 'note').toUpperCase()}] ${text}`);
        break;
      case 'checklist':
        if (text) lines.push(`${b.checked ? '[x]' : '[ ]'} ${text}`);
        break;
      case 'bullet':
        if (text) lines.push(`• ${text}`);
        break;
      case 'numbered':
        numberedIdx += 1;
        if (text) lines.push(`${numberedIdx}. ${text}`);
        break;
      case 'toggle': {
        const extra = stripHtmlPlain(b.childrenHtml || '');
        if (text) lines.push(`▸ ${text}`);
        if (extra) lines.push(extra);
        break;
      }
      case 'table':
      case 'sheet':
        if (b.tableData && b.tableData.length > 0) {
          b.tableData.forEach((row) => {
            const cleaned = row.map((cell) => cell.trim()).filter(Boolean);
            if (cleaned.length > 0) lines.push(cleaned.join(' · '));
          });
        }
        break;
      case 'photo':
        if (b.photoCaption) lines.push(`[Photo: ${b.photoCaption}]`);
        break;
      case 'voice':
        lines.push(`[Voice memo${b.audioDuration ? ` (${Math.round(b.audioDuration)}s)` : ''}]`);
        break;
      case 'mood':
      case 'sticker':
      case 'washi':
      case 'divider':
        break;
      default:
        if (text) lines.push(text);
        break;
    }
  });

  return lines;
}

export function formatEntryShareText(note: JournalNote, mood: MoodMeta | null): string {
  const formattedDate = formatLongDate(fromDateKey(note.dateKey));
  const year = fromDateKey(note.dateKey).getFullYear();
  const lines: string[] = [`${formattedDate}, ${year}`];

  if (mood) {
    lines.push(`Mood: ${mood.label}`);
  }

  lines.push('');

  const title = note.title.trim();
  if (title) {
    lines.push(title);
    lines.push('');
  }

  const bodyLines = extractEntryLines(note.blocks);
  if (bodyLines.length > 0) {
    lines.push(...bodyLines);
  } else {
    lines.push('(No body text)');
  }

  if (note.tags.length > 0) {
    lines.push('');
    lines.push(note.tags.map((t) => `#${t}`).join(' '));
  }

  return lines.join('\n').trim();
}

export async function shareEntryAsText(
  note: JournalNote,
  mood: MoodMeta | null
): Promise<'shared' | 'copied' | 'cancelled'> {
  const formattedText = formatEntryShareText(note, mood);
  const title = note.title.trim() || `Journal Entry · ${note.dateKey}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title,
        text: formattedText,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall back to clipboard
    }
  }

  await copyToClipboard(formattedText);
  return 'copied';
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | { tl: number; tr: number; br: number; bl: number }
) {
  const radii =
    typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + radii.tl, y);
  ctx.lineTo(x + w - radii.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radii.tr);
  ctx.lineTo(x + w, y + h - radii.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radii.br, y + h);
  ctx.lineTo(x + radii.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radii.bl);
  ctx.lineTo(x, y + radii.tl);
  ctx.quadraticCurveTo(x, y, x + radii.tl, y);
  ctx.closePath();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

function drawMoodEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  score: number,
  fillHex: string
) {
  ctx.save();
  ctx.fillStyle = fillHex;
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner geometric motif matching score
  ctx.fillStyle = '#111111';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (score >= 6) {
    // 4-point star spark
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const ang = (i * Math.PI) / 4 - Math.PI / 2;
      const rad = i % 2 === 0 ? radius * 0.56 : radius * 0.24;
      const px = cx + Math.cos(ang) * rad;
      const py = cy + Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (score === 5) {
    // Upward chevron / sunny arc
    ctx.beginPath();
    ctx.arc(cx, cy - radius * 0.05, radius * 0.42, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - radius * 0.24, cy - radius * 0.22, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + radius * 0.24, cy - radius * 0.22, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (score === 4) {
    // Calm wave
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.45, cy);
    ctx.quadraticCurveTo(cx - radius * 0.2, cy - radius * 0.3, cx, cy);
    ctx.quadraticCurveTo(cx + radius * 0.2, cy + radius * 0.3, cx + radius * 0.45, cy);
    ctx.stroke();
  } else if (score === 3) {
    // Steady horizontal bar
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.42, cy);
    ctx.lineTo(cx + radius * 0.42, cy);
    ctx.stroke();
  } else {
    // Soft crescent / raindrop motif
    ctx.beginPath();
    ctx.arc(cx, cy + radius * 0.28, radius * 0.42, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}

function drawNotebookMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.strokeStyle = '#52525B';
  ctx.fillStyle = '#84C9A6';
  ctx.lineWidth = 2.4;
  drawRoundedRectPath(ctx, x, y, size, size, 5);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + size * 0.32, y + 1);
  ctx.lineTo(x + size * 0.32, y + size - 1);
  ctx.stroke();
  ctx.restore();
}

export async function renderEntryToCanvas(
  note: JournalNote,
  mood: MoodMeta | null,
  options?: { noteFontFamily?: string }
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch {
      // Ignore font wait failure offline
    }
  }

  const SIZE = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  const displayFont = '"Space Grotesk", system-ui, -apple-system, sans-serif';
  const bodyFont = options?.noteFontFamily
    ? `"${options.noteFontFamily}", "Work Sans", system-ui, sans-serif`
    : '"Work Sans", "DM Sans", system-ui, sans-serif';
  const monoFont = '"JetBrains Mono", ui-monospace, monospace';

  const accentHex = mood ? mood.bgHex : '#84C9A6';
  const subAccentHex = mood ? mood.subTextHex : '#0A2E1E';

  // 1. Outer Canvas Background + Subtle Craft Dots
  ctx.fillStyle = '#FAF5E8';
  ctx.fillRect(0, 0, SIZE, SIZE);

  ctx.fillStyle = 'rgba(17, 17, 17, 0.065)';
  const step = 36;
  for (let gx = 24; gx < SIZE; gx += step) {
    for (let gy = 24; gy < SIZE; gy += step) {
      ctx.beginPath();
      ctx.arc(gx, gy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Main Neo-Brutalist Card + Hard Offset Shadow
  const cardX = 72;
  const cardY = 72;
  const cardW = SIZE - cardX * 2 - 10; // leave breathing room for hard offset shadow
  const cardH = SIZE - cardY * 2 - 10;
  const radius = 28;
  const shadowOffset = 14;

  // Hard offset shadow
  ctx.fillStyle = '#111111';
  drawRoundedRectPath(ctx, cardX + shadowOffset, cardY + shadowOffset, cardW, cardH, radius);
  ctx.fill();

  // Card white background
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  // 3. Top Mood/Theme Header Strip clipped inside card
  const headerH = 152;
  ctx.save();
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();

  ctx.fillStyle = accentHex;
  ctx.fillRect(cardX, cardY, cardW, headerH);

  // Header bottom border
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + headerH);
  ctx.lineTo(cardX + cardW, cardY + headerH);
  ctx.stroke();

  // Date badge inside header left
  const entryDate = fromDateKey(note.dateKey);
  const weekdayStr = entryDate
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toUpperCase();
  const dateStr = entryDate
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();

  ctx.fillStyle = subAccentHex;
  ctx.font = `700 20px ${monoFont}`;
  ctx.fillText(weekdayStr, cardX + 48, cardY + 62);

  ctx.fillStyle = '#111111';
  ctx.font = `800 34px ${displayFont}`;
  ctx.fillText(dateStr, cardX + 48, cardY + 108);

  // Right Badge inside header (Mood badge if available, else Notebook tag)
  if (mood) {
    ctx.font = `800 24px ${displayFont}`;
    const labelWidth = ctx.measureText(mood.label).width;
    const pillW = labelWidth + 82;
    const pillH = 58;
    const pillX = cardX + cardW - 44 - pillW;
    const pillY = cardY + (headerH - pillH) / 2;

    // Pill shadow
    ctx.fillStyle = '#111111';
    drawRoundedRectPath(ctx, pillX + 4, pillY + 4, pillW, pillH, 16);
    ctx.fill();

    // Pill surface
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, 16);
    ctx.fill();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    drawMoodEmblem(ctx, pillX + 30, pillY + pillH / 2, 16, mood.score, mood.bgHex);

    ctx.fillStyle = '#111111';
    ctx.fillText(mood.label, pillX + 58, pillY + 37);
  } else {
    const tagText = 'JOURNAL ENTRY';
    ctx.font = `800 20px ${monoFont}`;
    const tw = ctx.measureText(tagText).width;
    const pillW = tw + 36;
    const pillH = 48;
    const pillX = cardX + cardW - 44 - pillW;
    const pillY = cardY + (headerH - pillH) / 2;

    ctx.fillStyle = '#111111';
    drawRoundedRectPath(ctx, pillX + 3, pillY + 3, pillW, pillH, 14);
    ctx.fill();

    ctx.fillStyle = '#FAF5E8';
    drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, 14);
    ctx.fill();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.fillText(tagText, pillX + 18, pillY + 31);
  }

  // 4. Entry Title & Accent Rule
  const innerX = cardX + 52;
  const innerMaxW = cardW - 104;
  let cursorY = cardY + headerH + 64;

  const titleText = note.title.trim() || 'Untitled Note';
  ctx.fillStyle = '#111111';
  ctx.font = `800 48px ${displayFont}`;
  const rawTitleLines = wrapTextLines(ctx, titleText, innerMaxW);
  const titleLines = rawTitleLines.slice(0, 2);
  if (rawTitleLines.length > 2 && titleLines[1]) {
    let trimmed = titleLines[1];
    while (trimmed.length > 3 && ctx.measureText(`${trimmed}...`).width > innerMaxW) {
      trimmed = trimmed.slice(0, -1);
    }
    titleLines[1] = `${trimmed.trim()}...`;
  }

  titleLines.forEach((line) => {
    ctx.fillText(line, innerX, cursorY);
    cursorY += 58;
  });

  // Accent bar under title
  ctx.fillStyle = accentHex;
  drawRoundedRectPath(ctx, innerX, cursorY - 26, 84, 10, 5);
  ctx.fill();
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  cursorY += 28;

  // 5. Entry Body Text
  const footerHeight = 82;
  const tagsHeight = note.tags.length > 0 ? 58 : 0;
  const maxBodyBottomY = cardY + cardH - footerHeight - tagsHeight - 24;

  const entryParagraphs = extractEntryLines(note.blocks);
  const bodyFontSize = entryParagraphs.join(' ').length > 280 ? 28 : 32;
  const lineHeight = Math.round(bodyFontSize * 1.46);
  ctx.font = `500 ${bodyFontSize}px ${bodyFont}`;

  if (entryParagraphs.length === 0) {
    ctx.fillStyle = '#71717A';
    ctx.fillText('Quiet reflection captured on device.', innerX, cursorY + 6);
  } else {
    ctx.fillStyle = '#18181B';
    let truncated = false;

    for (let pIdx = 0; pIdx < entryParagraphs.length; pIdx += 1) {
      if (truncated) break;
      const wrapped = wrapTextLines(ctx, entryParagraphs[pIdx], innerMaxW);
      for (let lIdx = 0; lIdx < wrapped.length; lIdx += 1) {
        if (cursorY + lineHeight > maxBodyBottomY) {
          // Draw ellipsis on previous or current truncated line cleanly
          truncated = true;
          break;
        }
        const willBeLastSlot = cursorY + lineHeight * 2 > maxBodyBottomY;
        const hasMoreContent =
          lIdx < wrapped.length - 1 || pIdx < entryParagraphs.length - 1;

        let lineToDraw = wrapped[lIdx];
        if (willBeLastSlot && hasMoreContent) {
          while (
            lineToDraw.length > 3 &&
            ctx.measureText(`${lineToDraw}...`).width > innerMaxW
          ) {
            lineToDraw = lineToDraw.slice(0, -1);
          }
          lineToDraw = `${lineToDraw.trim()}...`;
          ctx.fillText(lineToDraw, innerX, cursorY);
          truncated = true;
          break;
        }

        ctx.fillText(lineToDraw, innerX, cursorY);
        cursorY += lineHeight;
      }
      cursorY += 12; // paragraph breathing space
    }
  }

  // 6. Optional Tags Row above Footer
  if (note.tags.length > 0) {
    let tagX = innerX;
    const tagY = cardY + cardH - footerHeight - 52;
    ctx.font = `700 20px ${bodyFont}`;

    for (const rawTag of note.tags.slice(0, 4)) {
      const label = `#${rawTag}`;
      const lw = ctx.measureText(label).width;
      const chipW = lw + 28;
      if (tagX + chipW > cardX + cardW - 48) break;

      ctx.fillStyle = '#FAF5E8';
      drawRoundedRectPath(ctx, tagX, tagY, chipW, 36, 10);
      ctx.fill();
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#111111';
      ctx.fillText(label, tagX + 14, tagY + 25);
      tagX += chipW + 10;
    }
  }

  // 7. Bottom Subtle App Watermark
  const footerY = cardY + cardH - footerHeight;
  ctx.strokeStyle = '#E4E4E7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(innerX, footerY);
  ctx.lineTo(cardX + cardW - 52, footerY);
  ctx.stroke();

  drawNotebookMark(ctx, innerX, footerY + 25, 28);

  ctx.fillStyle = '#52525B';
  ctx.font = `700 21px ${displayFont}`;
  ctx.fillText('Soliloquy · Private Offline Entry', innerX + 40, footerY + 46);

  ctx.fillStyle = '#71717A';
  ctx.font = `600 18px ${monoFont}`;
  const stamp = note.dateKey;
  const stampW = ctx.measureText(stamp).width;
  ctx.fillText(stamp, cardX + cardW - 52 - stampW, footerY + 45);

  ctx.restore();

  // Outer card crisp 5px Neo-Brutalist border drawn on top so corners stay razor sharp
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 5;
  drawRoundedRectPath(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.stroke();

  return canvas;
}

export async function downloadEntryImageCard(
  note: JournalNote,
  mood: MoodMeta | null,
  options?: { noteFontFamily?: string }
): Promise<void> {
  const canvas = await renderEntryToCanvas(note, mood, options);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!blob) throw new Error('Could not generate PNG image.');

  const url = URL.createObjectURL(blob);
  const slug = (note.title || 'entry')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  const filename = `soliloquy-${note.dateKey}${slug ? `-${slug}` : ''}.png`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
