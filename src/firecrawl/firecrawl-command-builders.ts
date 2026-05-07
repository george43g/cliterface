import { z } from 'zod';

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .refine(
    val => {
      try {
        const u = new URL(val);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be a valid http:// or https:// URL' },
  );

export const depthSchema = z.number().int('Must be an integer').min(1, 'Minimum depth is 1').max(50, 'Maximum depth is 50');

export const limitSchema = z.number().int('Must be an integer').min(1, 'Minimum is 1').max(10000, 'Maximum is 10 000');

export function validateUrl(url: string): string | null {
  const result = urlSchema.safeParse(url);
  return result.success ? null : (result.error.issues[0]?.message ?? 'Invalid URL');
}

export function validateDepth(depth: number): string | null {
  const result = depthSchema.safeParse(depth);
  return result.success ? null : (result.error.issues[0]?.message ?? 'Invalid depth');
}

export function validateLimit(limit: number): string | null {
  const result = limitSchema.safeParse(limit);
  return result.success ? null : (result.error.issues[0]?.message ?? 'Invalid limit');
}

// ── Scrape format options ─────────────────────────────────────────────────────

export const SCRAPE_FORMATS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'rawHtml', label: 'Raw HTML' },
  { value: 'links', label: 'Links' },
  { value: 'images', label: 'Images' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'summary', label: 'Summary' },
  { value: 'json', label: 'JSON' },
] as const;

export type ScrapeFormat = (typeof SCRAPE_FORMATS)[number]['value'];

// ── Search time filters ───────────────────────────────────────────────────────

export const SEARCH_TBS_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'qdr:h', label: 'Past hour' },
  { value: 'qdr:d', label: 'Past 24 hours' },
  { value: 'qdr:w', label: 'Past week' },
  { value: 'qdr:m', label: 'Past month' },
  { value: 'qdr:y', label: 'Past year' },
] as const;

// ── Map sitemap modes ─────────────────────────────────────────────────────────

export const MAP_SITEMAP_MODES = [
  { value: 'include', label: 'Include sitemap' },
  { value: 'only', label: 'Sitemap only' },
  { value: 'skip', label: 'Skip sitemap' },
] as const;

// ── Agent models ──────────────────────────────────────────────────────────────

export const AGENT_MODELS = [
  { value: 'spark-1-mini', label: 'Spark 1 Mini (cheaper)' },
  { value: 'spark-1-pro', label: 'Spark 1 Pro (higher accuracy)' },
] as const;

// ── Browser preset commands ───────────────────────────────────────────────────

export const BROWSER_PRESETS = [
  { label: 'Snapshot page', code: 'snapshot' },
  { label: 'Scrape page', code: 'scrape' },
  { label: 'List links', code: 'links' },
  { label: 'Take screenshot', code: 'screenshot' },
  { label: 'Get page title', code: 'title' },
] as const;
