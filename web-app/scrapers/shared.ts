import { bdclient } from "@brightdata/sdk";
import { load, type CheerioAPI } from "cheerio";

export interface BrightDataScrapeOptions {
  country?: string;
  timeout?: number;
  zone?: string;
}

export type JsonRecord = Record<string, unknown>;

export function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function stringOrNumber(value: unknown): string | number | null {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

export function pythonTruthy(value: unknown): boolean {
  if (value == null || value === false) return false;
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
  if (typeof value === "string" || Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

export function parseJsonScript(html: string, selector: string): unknown | null {
  const contents = load(html)(selector).first().html();
  if (!contents) return null;

  try {
    return JSON.parse(contents) as unknown;
  } catch {
    return null;
  }
}

export function cleanText(element: ReturnType<CheerioAPI>): string | null {
  const text = element.text().replace(/\s+/g, " ").trim();
  return text || null;
}

export function parsePrice(
  element: ReturnType<CheerioAPI>,
  pattern: RegExp,
): number | null {
  const match = cleanText(element)?.match(pattern);
  return match ? numberValue(match[0].replaceAll(",", "")) : null;
}

export async function scrapeHtml(
  url: string,
  options: BrightDataScrapeOptions = {},
): Promise<string> {
  const apiKey =
    process.env.BRIGHTDATA_API_TOKEN ?? process.env.BRIGHTDATA_API_KEY;
  const client = new bdclient(apiKey ? { apiKey } : {});
  const zone =
    options.zone ??
    process.env.BRIGHTDATA_WEB_UNLOCKER_ZONE ??
    process.env.BRIGHTDATA_UNLOCKER_ZONE ??
    "deal_unlocker";

  try {
    return await client.scrapeUrl(url, {
      format: "raw",
      dataFormat: "html",
      zone,
      country: options.country,
      timeout: options.timeout,
    });
  } finally {
    await client.close();
  }
}
