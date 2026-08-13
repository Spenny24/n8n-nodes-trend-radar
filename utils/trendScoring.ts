export interface ScoreInput {
  views?: number;
  searchVolume?: number;
  publishedAt?: string;
  now?: Date;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateTrendScore(input: ScoreInput): number {
  const now = input.now ?? new Date();
  const published = input.publishedAt ? new Date(input.publishedAt) : now;
  const ageHours = Math.max(0, (now.getTime() - published.getTime()) / 3_600_000);

  // Recency: 100 now, decays to 0 over seven days.
  const recency = clamp(100 - (ageHours / 168) * 100);

  // Popularity: logarithmic so one viral item does not flatten every other result.
  const popularityBase = Math.max(input.views ?? 0, input.searchVolume ?? 0);
  const popularity = popularityBase > 0
    ? clamp((Math.log10(popularityBase + 1) / 7) * 100)
    : 50;

  return Math.round(recency * 0.55 + popularity * 0.45);
}
