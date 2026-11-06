/**
 * The weather under the Christmas skin: snowfalls at random times, and snowmen
 * that build themselves along the edge of the map while it snows and melt at
 * dawn. Plain functions of the real time since the page loaded, so Vitest can
 * run them with a fixed seed.
 */

import { REAL_MS_PER_CARNIVAL_DAY } from '../carnival';
import { seededRandom, type MidwayMap, type Point } from './world';

/** A snowfall lasts 4 carnival hours: 50 real seconds. */
export const SNOWFALL_MS = (4 / 24) * REAL_MS_PER_CARNIVAL_DAY;
/** How long the snow takes to start or stop. */
export const SNOW_RAMP_MS = 2000;
/** The shortest dry spell between two snowfalls, so each one clearly stops. */
export const MIN_GAP_MS = 20_000;
/** A snowman takes 10 real seconds of snow to build. */
export const SNOWMAN_BUILD_MS = 10_000;
/** How long the snowmen take to melt away at dawn. */
export const MELT_MS = 3000;
/** The carnival hour the snowmen melt at. */
export const DAWN_HOUR = 6;

/** One snowfall, in real milliseconds since the page loaded. */
export interface Snowfall {
  start: number;
  end: number;
}

/**
 * Every snowfall that starts before `untilMs`, in order. The dry spells
 * between them are random, averaging one snowfall per carnival day, so they
 * never overlap. With `snowAtStart`, the first one starts at 0.
 */
export function snowfalls(seed: number, untilMs: number, snowAtStart = false): Snowfall[] {
  const random = seededRandom(seed);
  // A gap of MIN_GAP_MS plus an even share of twice the rest averages out to a
  // snowfall and its gap filling one carnival day.
  const spread = 2 * (REAL_MS_PER_CARNIVAL_DAY - SNOWFALL_MS - MIN_GAP_MS);
  const gap = () => MIN_GAP_MS + random() * spread;
  const out: Snowfall[] = [];
  let start = snowAtStart ? 0 : random() * spread;
  while (start < untilMs) {
    out.push({ start, end: start + SNOWFALL_MS });
    start += SNOWFALL_MS + gap();
  }
  return out;
}

/** How hard it's snowing at a moment, from 0 to 1, easing in and out over SNOW_RAMP_MS. */
export function snowAt(ms: number, schedule: readonly Snowfall[]): number {
  for (const s of schedule) {
    if (ms <= s.start || ms >= s.end) continue;
    return Math.min(1, (ms - s.start) / SNOW_RAMP_MS, (s.end - ms) / SNOW_RAMP_MS);
  }
  return 0;
}

/** How many milliseconds it snowed between `from` and `to`. */
export function snowTime(schedule: readonly Snowfall[], from: number, to: number): number {
  let total = 0;
  for (const s of schedule) total += Math.max(0, Math.min(to, s.end) - Math.max(from, s.start));
  return total;
}

/** The real time of the most recent dawn at or before `ms`, for a clock started at `startHour`. Negative before the first one. */
export function lastDawn(ms: number, startHour: number): number {
  const msPerHour = REAL_MS_PER_CARNIVAL_DAY / 24;
  const first = ((((DAWN_HOUR - startHour) % 24) + 24) % 24) * msPerHour;
  return first + Math.floor((ms - first) / REAL_MS_PER_CARNIVAL_DAY) * REAL_MS_PER_CARNIVAL_DAY;
}

export interface Snowman {
  /** How far it's built, from 0 (not started) to 1 (finished). */
  progress: number;
  /** How far it has melted, from 0 (standing) to 1 (gone). */
  melt: number;
}

/**
 * The snowmen on each of `spots` spots at a moment. They build one after
 * another, SNOWMAN_BUILD_MS of snow each, and the one being built when the
 * snow stops waits for the next snowfall. At dawn they all melt over MELT_MS,
 * and building starts again once they have gone.
 */
export function snowmenAt(
  ms: number,
  schedule: readonly Snowfall[],
  startHour: number,
  spots: number,
): Snowman[] {
  const dawn = lastDawn(ms, startHour);
  // Building starts at page load, or once the last dawn's snowmen have melted.
  const buildFrom = (d: number) => (d <= 0 ? 0 : d + MELT_MS);
  const melting = dawn > 0 && ms < dawn + MELT_MS;
  const built = melting
    ? snowTime(schedule, buildFrom(dawn - REAL_MS_PER_CARNIVAL_DAY), dawn)
    : snowTime(schedule, buildFrom(dawn), ms);
  const melt = melting ? (ms - dawn) / MELT_MS : 0;
  const done = built / SNOWMAN_BUILD_MS;
  return Array.from({ length: spots }, (_, i) => ({
    progress: Math.max(0, Math.min(1, done - i)),
    melt,
  }));
}

/** How far each part of a snowman is built, each from 0 to 1. */
export interface SnowmanParts {
  bottom: number;
  middle: number;
  head: number;
  /** The coal eyes, the carrot nose, the scarf and the hat. */
  dressing: number;
}

/** A snowman's build progress split into its four stages, a quarter each. */
export function snowmanParts(progress: number): SnowmanParts {
  const stage = (i: number) => Math.max(0, Math.min(1, progress * 4 - i));
  return { bottom: stage(0), middle: stage(1), head: stage(2), dressing: stage(3) };
}

/**
 * The 8 spots for snowmen, in the order they build: out on the snowy field
 * just past the front hedges, four along the front either side of the gate and
 * four down the right. Nobody can walk past the hedge, so a snowman never gets
 * in anyone's way, and both hedges stand behind them.
 */
export function snowmanSpots(map: MidwayMap): Point[] {
  const { width, height, avenueX } = map;
  const front = height + 0.8;
  const right = width + 0.8;
  return [
    { x: avenueX - 5.5, y: front },
    { x: right, y: height - 4.5 },
    { x: avenueX + 7.5, y: front },
    { x: right, y: height * 0.65 },
    { x: 2.5, y: front },
    { x: right, y: height * 0.35 },
    { x: width - 2.5, y: front },
    { x: right, y: 3.5 },
  ];
}

/** Whether the page asked for snow straight away: `?snow=1`. */
export function snowAtStartFrom(search: string): boolean {
  return new URLSearchParams(search).get('snow') === '1';
}
