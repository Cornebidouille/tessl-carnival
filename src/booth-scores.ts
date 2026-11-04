import type { ScoreEntry } from './carnival';

/** How many scores a booth card lists. */
export const BOOTH_SCORE_COUNT = 5;
export const NO_SCORES = 'No scores yet';

/** What a booth card shows about a game's scores: a heading, and the scores to list under it, highest first. */
export function boothScores(entries: readonly ScoreEntry[]): { heading: string; scores: number[] } {
  if (entries.length === 0) return { heading: NO_SCORES, scores: [] };
  const scores = entries
    .map((entry) => entry.score)
    .sort((a, b) => b - a)
    .slice(0, BOOTH_SCORE_COUNT);
  return { heading: 'Top scores', scores };
}
