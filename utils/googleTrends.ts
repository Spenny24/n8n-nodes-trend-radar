export interface GoogleTrendItem {
  title: string;
  url?: string;
  publishedAt?: string;
  searchVolume?: number;
  source: 'google_trends';
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getTagValue(itemXml: string, tagName: string): string | undefined {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = itemXml.match(new RegExp(`<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : undefined;
}

function parseVolume(raw: unknown): number | undefined {
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;
  const text = String(raw).trim().toUpperCase().replace(/,/g, '');
  const match = text.match(/^([\d.]+)\s*([KMB])?\+?$/);
  if (!match) return undefined;
  const value = Number(match[1]);
  const multiplier = match[2] === 'B' ? 1_000_000_000 : match[2] === 'M' ? 1_000_000 : match[2] === 'K' ? 1_000 : 1;
  return Math.round(value * multiplier);
}

function parsePublishedAt(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const timestamp = Date.parse(raw);
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
}

export function parseGoogleTrendsRss(xml: string): GoogleTrendItem[] {
  const itemMatches = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches
    .map((itemXml) => {
      return {
        title: getTagValue(itemXml, 'title') ?? '',
        url: getTagValue(itemXml, 'link'),
        publishedAt: parsePublishedAt(getTagValue(itemXml, 'pubDate')),
        searchVolume: parseVolume(getTagValue(itemXml, 'ht:approx_traffic')),
        source: 'google_trends' as const,
      };
    })
    .filter((item: GoogleTrendItem) => item.title.length > 0);
}
