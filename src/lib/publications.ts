import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type PublicationType =
  'article' | 'inproceedings' | 'conference' | 'misc' | 'preprint' | 'other';

export interface PublicationAuthor {
  given: string;
  family: string;
  display: string;
}

export interface Publication {
  id: string;
  type: PublicationType;
  sourceType: string;
  title: string;
  authors: PublicationAuthor[];
  year?: number;
  venue?: string;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords: string[];
  pdf?: string;
  code?: string;
  project?: string;
  slides?: string;
  poster?: string;
  video?: string;
  selected: boolean;
  category?: string;
  rawBibtex: string;
}

interface RawEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
  raw: string;
}

const supportedTypes = new Set(['article', 'inproceedings', 'conference', 'misc', 'preprint']);

function matchingDelimiter(source: string, start: number): number {
  const open = source[start];
  const close = open === '{' ? '}' : ')';
  let depth = 0;
  let quoted = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' && source[index - 1] !== '\\') quoted = !quoted;
    if (quoted) continue;
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth === 0) return index;
  }
  throw new Error(`Invalid BibTeX: unclosed entry starting at character ${start}.`);
}

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '"' && value[index - 1] !== '\\') quoted = !quoted;
    if (!quoted && char === '{') depth += 1;
    if (!quoted && char === '}') depth -= 1;
    if (!quoted && depth === 0 && char === ',') {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function cleanValue(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).trim().replace(/[{}]/g, '');
  }
  if (/^\d+$/.test(trimmed)) return trimmed;
  throw new Error(`Invalid BibTeX value "${trimmed}". Use braces or quotes around text values.`);
}

export function parseBibtex(source: string): Publication[] {
  const entries: RawEntry[] = [];
  const withoutComments = source.replace(/^\s*%.*$/gm, '');
  const entryPattern = /@([a-zA-Z]+)\s*([({])/g;
  let match: RegExpExecArray | null;

  while ((match = entryPattern.exec(withoutComments))) {
    const type = match[1].toLowerCase();
    if (type === 'comment' || type === 'preamble' || type === 'string') {
      throw new Error(`Unsupported BibTeX directive @${type}; expand it into entry fields.`);
    }
    const openIndex = entryPattern.lastIndex - 1;
    const closeIndex = matchingDelimiter(withoutComments, openIndex);
    const raw = withoutComments.slice(match.index, closeIndex + 1).trim();
    const body = withoutComments.slice(openIndex + 1, closeIndex);
    const commaIndex = body.indexOf(',');
    if (commaIndex < 1) throw new Error(`Invalid BibTeX @${type} entry: missing citation key.`);
    const key = body.slice(0, commaIndex).trim();
    const fields: Record<string, string> = {};
    for (const field of splitTopLevel(body.slice(commaIndex + 1))) {
      if (!field.trim()) continue;
      const equals = field.indexOf('=');
      if (equals < 1) throw new Error(`Invalid field in BibTeX entry "${key}": ${field.trim()}`);
      const name = field.slice(0, equals).trim().toLowerCase();
      fields[name] = cleanValue(field.slice(equals + 1));
    }
    entries.push({ type, key, fields, raw });
    entryPattern.lastIndex = closeIndex + 1;
  }

  if (withoutComments.trim() && entries.length === 0) {
    throw new Error('Invalid BibTeX: no entries could be parsed.');
  }

  return entries
    .map(({ type, key, fields, raw }): Publication => {
      if (!fields.title || !fields.author) {
        throw new Error(`BibTeX entry "${key}" requires title and author fields.`);
      }
      const normalizedType = supportedTypes.has(type) ? (type as PublicationType) : 'other';
      const authors = fields.author.split(/\s+and\s+/i).map(normalizeAuthor);
      const year = fields.year ? Number.parseInt(fields.year, 10) : undefined;
      if (fields.year && (!year || !/^\d{4}$/.test(fields.year))) {
        throw new Error(`BibTeX entry "${key}" has an invalid year.`);
      }
      return {
        id: key,
        type: normalizedType,
        sourceType: type,
        title: fields.title,
        authors,
        year,
        venue: fields.journal ?? fields.booktitle ?? fields.publisher,
        journal: fields.journal,
        booktitle: fields.booktitle,
        publisher: fields.publisher,
        volume: fields.volume,
        number: fields.number,
        pages: fields.pages,
        doi: fields.doi?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, ''),
        url: fields.url,
        abstract: fields.abstract,
        keywords:
          fields.keywords
            ?.split(',')
            .map((item) => item.trim())
            .filter(Boolean) ?? [],
        pdf: fields.pdf,
        code: fields.code,
        project: fields.project,
        slides: fields.slides,
        poster: fields.poster,
        video: fields.video,
        selected: fields.selected?.toLowerCase() === 'true',
        category: fields.category,
        rawBibtex: raw,
      };
    })
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
}

export function normalizeAuthor(name: string): PublicationAuthor {
  const trimmed = name.trim();
  if (trimmed.includes(',')) {
    const [family, ...givenParts] = trimmed.split(',').map((part) => part.trim());
    const given = givenParts.join(' ');
    return { given, family, display: `${given} ${family}`.trim() };
  }
  const parts = trimmed.split(/\s+/);
  const family = parts.pop() ?? '';
  const given = parts.join(' ');
  return { given, family, display: trimmed };
}

export function getPublications(): Publication[] {
  const publicationFile = resolve(process.cwd(), 'src/content/publications.bib');
  return parseBibtex(readFileSync(publicationFile, 'utf8'));
}
