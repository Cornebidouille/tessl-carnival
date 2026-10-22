/** A carnival time of day, on a 24-hour clock. */
export interface CarnivalTime {
  hours: number;
  minutes: number;
}

export type PartOfDay = 'closed' | 'dawn' | 'midday' | 'afternoon' | 'evening' | 'night';

/** One carnival day of 24 hours lasts 5 real minutes. */
export const REAL_MS_PER_CARNIVAL_DAY = 5 * 60 * 1000;
/** The hour the clock starts at when the page has no `?hour=` option. */
export const DEFAULT_START_HOUR = 8;

const MINUTES_PER_DAY = 24 * 60;

/** Each part of the day starts at its hour and runs until the next part starts. */
const PARTS_OF_DAY: readonly { from: number; part: PartOfDay }[] = [
  { from: 2, part: 'closed' },
  { from: 6, part: 'dawn' },
  { from: 8, part: 'midday' },
  { from: 12, part: 'afternoon' },
  { from: 16, part: 'evening' },
  { from: 19, part: 'night' },
];

/** The carnival time a number of real milliseconds after the clock started at `startHour`. */
export function carnivalTimeAt(elapsedMs: number, startHour: number): CarnivalTime {
  const elapsedMinutes = Math.floor((elapsedMs * MINUTES_PER_DAY) / REAL_MS_PER_CARNIVAL_DAY);
  const total =
    (((startHour * 60 + elapsedMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

/** The part of the day a carnival time belongs to. Night runs past midnight until 02:00. */
export function partOfDay(time: CarnivalTime): PartOfDay {
  const started = PARTS_OF_DAY.filter((p) => time.hours >= p.from);
  return started.at(-1)?.part ?? 'night';
}

/** The carnival is open in every part of the day except closed. */
export function isOpen(time: CarnivalTime): boolean {
  return partOfDay(time) !== 'closed';
}

/** A label like `08:45`. */
export function formatCarnivalTime(time: CarnivalTime): string {
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
}

/** The start hour from a page's query string: `?hour=<0-23>`, or 8 when it's missing or not a whole hour. */
export function startHourFrom(search: string): number {
  const value = new URLSearchParams(search).get('hour');
  if (value === null || !/^\d{1,2}$/.test(value)) return DEFAULT_START_HOUR;
  const hour = Number(value);
  return hour <= 23 ? hour : DEFAULT_START_HOUR;
}

/** The carnival time now: the clock started when the page loaded, at the `?hour=` option's hour. */
export function currentCarnivalTime(
  msSincePageLoad: number = performance.now(),
  search: string = window.location.search,
): CarnivalTime {
  return carnivalTimeAt(msSincePageLoad, startHourFrom(search));
}
