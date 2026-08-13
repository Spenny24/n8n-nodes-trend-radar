import { describe, expect, it } from 'vitest';
import { calculateTrendScore } from '../utils/trendScoring';

const now = new Date('2026-08-13T12:00:00Z');

describe('calculateTrendScore', () => {
  it('rewards a recent high-volume item', () => {
    const strong = calculateTrendScore({ views: 2_000_000, publishedAt: '2026-08-13T11:00:00Z', now });
    const weak = calculateTrendScore({ views: 2_000, publishedAt: '2026-08-10T12:00:00Z', now });
    expect(strong).toBeGreaterThan(weak);
  });

  it('returns a bounded score', () => {
    expect(calculateTrendScore({ views: 9_999_999_999, publishedAt: '2026-08-13T12:00:00Z', now })).toBeLessThanOrEqual(100);
    expect(calculateTrendScore({ views: 0, publishedAt: '2025-01-01T00:00:00Z', now })).toBeGreaterThanOrEqual(0);
  });
});
