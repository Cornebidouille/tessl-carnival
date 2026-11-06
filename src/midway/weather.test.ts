import { describe, expect, it } from 'vitest';
import { REAL_MS_PER_CARNIVAL_DAY } from '../carnival';
import {
  lastDawn,
  MELT_MS,
  snowAt,
  snowAtStartFrom,
  SNOWFALL_MS,
  snowfalls,
  snowmanParts,
  snowmanSpots,
  snowmenAt,
  type Snowfall,
} from './weather';
import { canStand, layoutMidway } from './world';

const DAY = REAL_MS_PER_CARNIVAL_DAY;
const HOUR = DAY / 24;
const SECOND = 1000;

describe('snowfalls', () => {
  it('lasts 4 carnival hours, which is 50 real seconds', () => {
    expect(SNOWFALL_MS).toBe(4 * HOUR);
    expect(SNOWFALL_MS).toBe(50 * SECOND);
  });

  it('gives the same schedule for the same seed', () => {
    expect(snowfalls(42, 10 * DAY)).toEqual(snowfalls(42, 10 * DAY));
    expect(snowfalls(42, 10 * DAY)).not.toEqual(snowfalls(43, 10 * DAY));
  });

  it('never overlaps, and every snowfall lasts 4 carnival hours', () => {
    for (const seed of [1, 2, 3, 99, 12345]) {
      const schedule = snowfalls(seed, 50 * DAY);
      for (const s of schedule) expect(s.end - s.start).toBe(SNOWFALL_MS);
      for (let i = 1; i < schedule.length; i++)
        expect(schedule[i].start).toBeGreaterThan(schedule[i - 1].end);
    }
  });

  it('comes about once per carnival day', () => {
    const days = 200;
    const count = snowfalls(7, days * DAY).length;
    expect(count / days).toBeGreaterThan(0.8);
    expect(count / days).toBeLessThan(1.25);
  });

  it('starts at page load with ?snow=1', () => {
    expect(snowfalls(7, DAY, true)[0].start).toBe(0);
    expect(snowAtStartFrom('?snow=1')).toBe(true);
    expect(snowAtStartFrom('?hour=3&snow=1')).toBe(true);
    expect(snowAtStartFrom('')).toBe(false);
    expect(snowAtStartFrom('?snow=0')).toBe(false);
  });
});

describe('snowAt', () => {
  const schedule: Snowfall[] = [{ start: 10 * SECOND, end: 60 * SECOND }];

  it('is 0 outside a snowfall and 1 in the middle of one', () => {
    expect(snowAt(5 * SECOND, schedule)).toBe(0);
    expect(snowAt(30 * SECOND, schedule)).toBe(1);
    expect(snowAt(70 * SECOND, schedule)).toBe(0);
  });

  it('starts and stops over a couple of seconds', () => {
    expect(snowAt(11 * SECOND, schedule)).toBeCloseTo(0.5);
    expect(snowAt(59 * SECOND, schedule)).toBeCloseTo(0.5);
  });
});

describe('snowmen', () => {
  // A clock started at 08:00 reaches dawn 22 carnival hours later.
  const startHour = 8;
  const dawn = 22 * HOUR;
  const snowing: Snowfall[] = [{ start: 0, end: SNOWFALL_MS }];

  it('builds the first snowman in 10 real seconds', () => {
    expect(snowmenAt(0, snowing, startHour, 8)[0].progress).toBe(0);
    expect(snowmenAt(5 * SECOND, snowing, startHour, 8)[0].progress).toBe(0.5);
    const at10 = snowmenAt(10 * SECOND, snowing, startHour, 8);
    expect(at10[0].progress).toBe(1);
    expect(at10[1].progress).toBe(0);
  });

  it('builds them one after another, 5 in a full snowfall', () => {
    const after = snowmenAt(SNOWFALL_MS + 10 * SECOND, snowing, startHour, 8);
    expect(after.map((s) => s.progress)).toEqual([1, 1, 1, 1, 1, 0, 0, 0]);
  });

  it('stops when the snow stops and finishes the same snowman at the next snowfall', () => {
    const schedule: Snowfall[] = [
      { start: 0, end: 15 * SECOND },
      { start: 60 * SECOND, end: 110 * SECOND },
    ];
    expect(snowmenAt(30 * SECOND, schedule, startHour, 8)[1].progress).toBe(0.5);
    expect(snowmenAt(59 * SECOND, schedule, startHour, 8)[1].progress).toBe(0.5);
    const resumed = snowmenAt(65 * SECOND, schedule, startHour, 8);
    expect(resumed[1].progress).toBe(1);
    expect(resumed[2].progress).toBe(0);
  });

  it('builds no more once every spot has a snowman', () => {
    const long: Snowfall[] = [
      { start: 0, end: SNOWFALL_MS },
      { start: 60 * SECOND, end: 60 * SECOND + SNOWFALL_MS },
    ];
    const all = snowmenAt(dawn - SECOND, long, startHour, 8);
    expect(all.every((s) => s.progress === 1 && s.melt === 0)).toBe(true);
  });

  it('keeps finished snowmen until dawn, then melts them and frees the spots', () => {
    expect(snowmenAt(dawn - SECOND, snowing, startHour, 8)[0]).toEqual({ progress: 1, melt: 0 });
    const melting = snowmenAt(dawn + MELT_MS / 2, snowing, startHour, 8)[0];
    expect(melting.progress).toBe(1);
    expect(melting.melt).toBe(0.5);
    expect(snowmenAt(dawn + MELT_MS, snowing, startHour, 8)[0]).toEqual({ progress: 0, melt: 0 });
  });

  it('builds again after dawn, from the first spot', () => {
    const later: Snowfall[] = [...snowing, { start: dawn + 20 * SECOND, end: dawn + 70 * SECOND }];
    expect(snowmenAt(dawn + 25 * SECOND, later, startHour, 8)[0].progress).toBe(0.5);
  });

  it('finds the last dawn for any start hour', () => {
    expect(lastDawn(0, 6)).toBe(0);
    expect(lastDawn(HOUR, 6)).toBe(0);
    expect(lastDawn(0, 8)).toBe(22 * HOUR - DAY);
    expect(lastDawn(22 * HOUR, 8)).toBe(22 * HOUR);
    expect(lastDawn(0, 3)).toBe(3 * HOUR - DAY);
  });
});

describe('snowmanParts', () => {
  it('builds the bottom, middle, head and then the dressing', () => {
    expect(snowmanParts(0)).toEqual({ bottom: 0, middle: 0, head: 0, dressing: 0 });
    expect(snowmanParts(0.5)).toEqual({ bottom: 1, middle: 1, head: 0, dressing: 0 });
    expect(snowmanParts(1)).toEqual({ bottom: 1, middle: 1, head: 1, dressing: 1 });
  });
});

describe('snowmanSpots', () => {
  it('has 8 spots nobody can walk to, whatever the number of booths', () => {
    for (const games of [1, 4, 6, 10]) {
      const map = layoutMidway(
        Array.from({ length: games }, (_, i) => `game-${i}`),
        'christmas',
      );
      const spots = snowmanSpots(map);
      expect(spots).toHaveLength(8);
      for (const spot of spots) expect(canStand(map, spot.x, spot.y)).toBe(false);
    }
  });
});
