import { describe, expect, it } from 'vitest';
import { parseGoogleTrendsRss } from '../utils/googleTrends';

describe('parseGoogleTrendsRss', () => {
  it('normalises Google Trends RSS items without runtime dependencies', () => {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
      <rss xmlns:ht="https://trends.google.com/trending/rss">
        <channel>
          <item>
            <title><![CDATA[Example &amp; trend]]></title>
            <link>https://trends.google.com/trending/rss?geo=GB</link>
            <pubDate>Thu, 13 Aug 2026 10:00:00 GMT</pubDate>
            <ht:approx_traffic>2.5M+</ht:approx_traffic>
          </item>
        </channel>
      </rss>`;

    expect(parseGoogleTrendsRss(rss)).toEqual([
      {
        title: 'Example & trend',
        source: 'google_trends',
        url: 'https://trends.google.com/trending/rss?geo=GB',
        publishedAt: '2026-08-13T10:00:00.000Z',
        searchVolume: 2_500_000,
      },
    ]);
  });

  it('drops RSS items without a title', () => {
    const rss = '<rss><channel><item><link>https://example.com</link></item></channel></rss>';

    expect(parseGoogleTrendsRss(rss)).toEqual([]);
  });
});
