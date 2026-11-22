import { getMoodMeta } from '../constants/moods';
import { db, DEFAULT_SETTINGS } from '../db/database';
import type { BackupPayload, JournalNote } from '../types/journal';
import { toDateKey } from './dateUtils';

export async function buildBackupPayload(): Promise<BackupPayload> {
  const [checkIns, notes, folders, customTags, settings] = await Promise.all([
    db.checkIns.toArray(),
    db.notes.toArray(),
    db.folders.toArray(),
    db.customTags.toArray(),
    db.settings.get('default'),
  ]);

  const now = new Date().toISOString();
  const updatedSettings = { ...(settings || DEFAULT_SETTINGS), lastBackupAt: now };
  await db.settings.put(updatedSettings);

  return {
    version: 1,
    exportedAt: now,
    app: 'Soliloquy',
    checkIns,
    notes,
    folders,
    customTags,
    settings: updatedSettings,
  };
}

export function downloadJsonFile(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupPayload(raw: unknown): BackupPayload {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON file.');
  }
  const obj = raw as Partial<BackupPayload>;
  if (!Array.isArray(obj.checkIns) && !Array.isArray(obj.notes)) {
    throw new Error('File does not appear to be a valid Journal backup.');
  }
  return {
    version: typeof obj.version === 'number' ? obj.version : 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    app: 'Soliloquy',
    checkIns: Array.isArray(obj.checkIns) ? obj.checkIns : [],
    notes: Array.isArray(obj.notes) ? obj.notes : [],
    folders: Array.isArray(obj.folders) ? obj.folders : [],
    customTags: Array.isArray(obj.customTags) ? obj.customTags : [],
    settings:
      obj.settings && typeof obj.settings === 'object'
        ? { ...DEFAULT_SETTINGS, ...obj.settings, id: 'default' }
        : DEFAULT_SETTINGS,
  };
}

export async function restoreBackupPayload(payload: BackupPayload, mode: 'merge' | 'replace'): Promise<void> {
  await db.transaction('rw', [db.checkIns, db.notes, db.folders, db.customTags, db.settings], async () => {
    if (mode === 'replace') {
      await Promise.all([
        db.checkIns.clear(),
        db.notes.clear(),
        db.folders.clear(),
        db.customTags.clear(),
      ]);
    }
    if (payload.checkIns.length > 0) await db.checkIns.bulkPut(payload.checkIns);
    if (payload.notes.length > 0) await db.notes.bulkPut(payload.notes);
    if (payload.folders.length > 0) await db.folders.bulkPut(payload.folders);
    if (payload.customTags.length > 0) await db.customTags.bulkPut(payload.customTags);
    if (mode === 'replace' && payload.settings) {
      await db.settings.put({ ...DEFAULT_SETTINGS, ...payload.settings, id: 'default' });
    }
  });
}

function stripHtmlText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function formatNoteBlocks(note: JournalNote, markdown: boolean): string[] {
  const lines: string[] = [];
  let numbered = 0;

  note.blocks.forEach((b) => {
    const text = stripHtmlText(b.html).trim();
    if (b.type !== 'numbered') numbered = 0;

    switch (b.type) {
      case 'h1':
        lines.push(markdown ? `# ${text}` : text.toUpperCase());
        break;
      case 'h2':
        lines.push(markdown ? `## ${text}` : text);
        break;
      case 'h3':
        lines.push(markdown ? `### ${text}` : text);
        break;
      case 'quote':
      case 'pullquote':
        lines.push(`> ${text}`);
        break;
      case 'code':
        if (markdown) {
          lines.push('```');
          lines.push(text);
          lines.push('```');
        } else {
          lines.push(`    ${text}`);
        }
        break;
      case 'checklist':
        lines.push(`[${b.checked ? 'x' : ' '}] ${text}`);
        break;
      case 'bullet':
        lines.push(`- ${text}`);
        break;
      case 'numbered':
        numbered += 1;
        lines.push(`${numbered}. ${text}`);
        break;
      case 'divider':
        lines.push('---');
        break;
      case 'callout':
        lines.push(
          markdown
            ? `> **[${(b.calloutVariant || 'note').toUpperCase()}]** ${text}`
            : `[${(b.calloutVariant || 'note').toUpperCase()}] ${text}`
        );
        break;
      case 'table':
      case 'sheet':
        if (b.tableData && b.tableData.length > 0) {
          b.tableData.forEach((row, rIdx) => {
            lines.push(`| ${row.join(' | ')} |`);
            if (markdown && rIdx === 0) {
              lines.push(`| ${row.map(() => '---').join(' | ')} |`);
            }
          });
        }
        break;
      case 'photo':
        lines.push(`[Photo attached${b.photoCaption ? `: ${b.photoCaption}` : ''}]`);
        break;
      case 'voice':
        lines.push(`[Voice memo${b.audioDuration ? ` · ${Math.round(b.audioDuration)}s` : ''}]`);
        break;
      case 'mood':
        lines.push(`[Mood badge: ${text}]`);
        break;
      case 'sticker':
        lines.push(`[Sticker: ${b.stickerId || 'badge'}]`);
        break;
      case 'washi':
        lines.push('~~~~~~~~~~~~~~~~~~~~~~~~');
        break;
      default:
        if (text) lines.push(text);
    }
  });

  return lines;
}

export async function exportJournalAsReadableText(format: 'md' | 'txt'): Promise<void> {
  const [checkIns, notes, folders, settings] = await Promise.all([
    db.checkIns.orderBy('timestamp').toArray(),
    db.notes.orderBy('dateKey').toArray(),
    db.folders.toArray(),
    db.settings.get('default'),
  ]);

  const markdown = format === 'md';
  const folderMap = new Map(folders.map((f) => [f.id, f.name]));
  const lines: string[] = [];

  const owner = settings?.userName?.trim() ? `${settings.userName.trim()}’s ` : '';
  lines.push(markdown ? `# ${owner}Soliloquy Journal Archive` : `${owner.toUpperCase()}SOLILOQUY JOURNAL ARCHIVE`);
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push(`Entries: ${notes.length} notes · ${checkIns.length} mood check-ins`);
  lines.push('');

  if (notes.length > 0) {
    lines.push(markdown ? '## Journal Notes' : '================ JOURNAL NOTES ================');
    lines.push('');
    const sortedNotes = [...notes].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    sortedNotes.forEach((note) => {
      const folderName = note.folderId ? folderMap.get(note.folderId) : undefined;
      lines.push(markdown ? `### ${note.title || 'Untitled Note'}` : `* ${note.title || 'Untitled Note'}`);
      const meta = [
        `Date: ${note.dateKey}`,
        folderName ? `Folder: ${folderName}` : null,
        note.pinned ? 'Pinned' : null,
        note.tags.length > 0 ? `Tags: ${note.tags.map((t) => `#${t}`).join(' ')}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
      lines.push(meta);
      lines.push('');
      lines.push(...formatNoteBlocks(note, markdown));
      lines.push('');
      lines.push('----------------------------------------');
      lines.push('');
    });
  }

  if (checkIns.length > 0) {
    lines.push(markdown ? '## Mood Check-ins' : '================ MOOD CHECK-INS ================');
    lines.push('');
    const sortedCheckIns = [...checkIns].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    sortedCheckIns.forEach((c) => {
      const mood = getMoodMeta(c.moodScore);
      const time = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const tagStr = c.tags.length > 0 ? ` — ${c.tags.join(', ')}` : '';
      lines.push(`- [${c.dateKey} ${time}] ${mood.label} (${c.moodScore}/6)${tagStr}`);
      if (c.quickNote) {
        lines.push(`  Note: ${c.quickNote}`);
      }
      if (c.photoDataUrl) {
        lines.push('  [Photo attached]');
      }
    });
    lines.push('');
  }

  if (notes.length === 0 && checkIns.length === 0) {
    lines.push('No notes or mood check-ins recorded yet.');
  }

  const mime = markdown ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
  const blob = new Blob([lines.join('\n')], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soliloquy-archive-${toDateKey(new Date())}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportNoteAsMarkdown(note: JournalNote): void {
  const lines: string[] = [];
  lines.push(`# ${note.title || 'Untitled Note'}`);
  lines.push(`Date: ${note.dateKey}`);
  if (note.tags.length > 0) {
    lines.push(`Tags: ${note.tags.map((t) => `#${t}`).join(' ')}`);
  }
  lines.push('');
  lines.push(...formatNoteBlocks(note, true));
  lines.push('');

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(note.title || 'note').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${toDateKey(new Date())}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseImportedTextToBlocks(content: string): { title: string; blocks: JournalNote['blocks'] } {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let title = 'Imported Note';
  const blocks: JournalNote['blocks'] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (i === 0 && trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim() || title;
      return;
    }
    if (!trimmed) return;
    if (trimmed.startsWith('### ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'h3', html: trimmed.slice(4) });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'h2', html: trimmed.slice(3) });
    } else if (trimmed.startsWith('# ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'h1', html: trimmed.slice(2) });
    } else if (/^- \[(x| )\] /i.test(trimmed)) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'checklist',
        checked: trimmed[3].toLowerCase() === 'x',
        html: trimmed.slice(6),
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'bullet', html: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ id: crypto.randomUUID(), type: 'numbered', html: trimmed.replace(/^\d+\.\s/, '') });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'quote', html: trimmed.slice(2) });
    } else if (trimmed === '---' || trimmed === '***') {
      blocks.push({ id: crypto.randomUUID(), type: 'divider', html: '', dividerStyle: 'thick' });
    } else {
      blocks.push({ id: crypto.randomUUID(), type: 'paragraph', html: trimmed });
    }
  });

  if (blocks.length === 0) {
    blocks.push({ id: crypto.randomUUID(), type: 'paragraph', html: '' });
  }
  return { title, blocks };
}
