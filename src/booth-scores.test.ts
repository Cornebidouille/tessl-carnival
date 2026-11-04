import { describe, expect, it } from 'vitest';
import { createScoreBoard } from './carnival';
import { BOOTH_SCORE_COUNT, NO_SCORES, boothScores } from './booth-scores';

function memoryBoard() {
  const memory = new Map<string, string>();
  let clock = 0;
  return createScoreBoard(
    {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
    },
    () => clock++,
  );
}

describe('boothScores', () => {
  it('says there are no scores for a game nobody has played', () => {
    expect(boothScores(memoryBoard().top('water-cannon', BOOTH_SCORE_COUNT))).toEqual({
      heading: NO_SCORES,
      scores: [],
    });
  });

  it('lists the top five scores, highest first', () => {
    const board = memoryBoard();
    for (const score of [30, 120, 5, 80, 120, 60, 10]) board.record('water-cannon', score);
    expect(boothScores(board.top('water-cannon', BOOTH_SCORE_COUNT))).toEqual({
      heading: 'Top scores',
      scores: [120, 120, 80, 60, 30],
    });
  });

  it('lists fewer than five when fewer have been played', () => {
    const board = memoryBoard();
    board.record('water-cannon', 15);
    board.record('water-cannon', 40);
    expect(boothScores(board.top('water-cannon', BOOTH_SCORE_COUNT)).scores).toEqual([40, 15]);
  });

  it('never lists more than five, whatever it is given', () => {
    const entries = [1, 2, 3, 4, 5, 6, 7].map((score, at) => ({ gameId: 'g', score, at }));
    expect(boothScores(entries).scores).toEqual([7, 6, 5, 4, 3]);
  });
});
